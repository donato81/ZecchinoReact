import { supabase } from './client'
import type {
  AttachmentFileInput,
  AttachmentMimeType,
  AttachmentUploadResult,
  AttachmentValidationError,
} from '../types'
import { strings } from '@/locales'
import { matchesSignature, readFileHeader } from '@/lib/file-system/magic-bytes-reader'

const ATTACHMENTS_BUCKET = 'allegati-transazioni'
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024
const SIGNED_URL_TTL_SECONDS = 60 * 5
const MIME_TO_EXTENSIONS: Record<AttachmentMimeType, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'application/pdf': ['pdf'],
}
const EXTENSION_TO_SIGNATURE: Record<string, number[]> = {
  jpg: [0xff, 0xd8, 0xff],
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  pdf: [0x25, 0x50, 0x44, 0x46],
}

type FsModule = {
  readFile: (path: string, encoding: 'base64') => Promise<string>
}

function getFileNameError(): AttachmentValidationError {
  return {
    code: 'FILE_NAME_INVALID',
    message: strings['errors.allegati.fileNameInvalid'],
  }
}

function normalizeNameSegment(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function extractExtension(fileName: string): string | null {
  const trimmed = fileName.trim()
  const lastDot = trimmed.lastIndexOf('.')
  if (lastDot <= 0 || lastDot === trimmed.length - 1) {
    return null
  }

  return trimmed.slice(lastDot + 1).toLowerCase()
}

function sanitizeFilename(fileName: string): string {
  const trimmed = fileName.trim()
  if (!trimmed) {
    throw new Error(strings['errors.allegati.fileNameInvalid'])
  }

  const normalizedPath = trimmed.replace(/\\/g, '/').split('/').pop()?.trim() ?? ''
  const extension = extractExtension(normalizedPath)
  if (!normalizedPath || !extension) {
    throw new Error(strings['errors.allegati.fileNameInvalid'])
  }

  const baseName = normalizedPath.slice(0, normalizedPath.lastIndexOf('.'))
  const sanitizedBase = normalizeNameSegment(baseName)
  const sanitizedExtension = normalizeNameSegment(extension)
  if (!sanitizedBase || !sanitizedExtension) {
    throw new Error(strings['errors.allegati.fileNameInvalid'])
  }

  const limitedBase = sanitizedBase.slice(0, 80)
  return `${limitedBase}.${sanitizedExtension}`
}

function getMimeExtensions(mimeType: string): string[] {
  return MIME_TO_EXTENSIONS[mimeType as AttachmentMimeType] ?? []
}

function getExpectedMimeFromExtension(extension: string): AttachmentMimeType | null {
  return (Object.entries(MIME_TO_EXTENSIONS).find(([, extensions]) => extensions.includes(extension))?.[0] as AttachmentMimeType | undefined) ?? null
}

function buildUuid(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  const bytes = new Uint8Array(16)
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-')
}

function loadFsModule(): FsModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    return require('react-native-fs') as FsModule
  } catch {
    return null
  }
}

function normalizeFileUri(uri: string): string {
  return uri.startsWith('file://') ? uri.slice('file://'.length) : uri
}

function base64ToArrayBuffer(input: string): ArrayBuffer {
  const g = globalThis as typeof globalThis & {
    Buffer?: { from(str: string, enc: string): { buffer: ArrayBuffer; byteOffset: number; byteLength: number } }
  }
  if (g.Buffer) {
    const buffer = g.Buffer.from(input, 'base64')
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  }

  const binary = atob(input)
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
  return bytes.buffer
}

async function readFileAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const fsModule = loadFsModule()
  if (!fsModule) {
    throw new Error(strings['errors.allegati.uploadFailed'])
  }

  const base64 = await fsModule.readFile(normalizeFileUri(uri), 'base64')
  return base64ToArrayBuffer(base64)
}

export async function validateAttachmentFile(file: AttachmentFileInput): Promise<AttachmentValidationError | null> {
  if (!file.name.trim()) {
    return getFileNameError()
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      code: 'SIZE_LIMIT_EXCEEDED',
      message: strings['errors.allegati.sizeLimitExceeded'],
    }
  }

  const allowedExtensions = getMimeExtensions(file.type)
  if (allowedExtensions.length === 0) {
    return {
      code: 'MIME_NOT_ALLOWED',
      message: strings['errors.allegati.mimeNotAllowed'],
    }
  }

  const extension = extractExtension(file.name)
  if (!extension) {
    return getFileNameError()
  }

  const expectedMime = getExpectedMimeFromExtension(extension)
  if (!expectedMime || !allowedExtensions.includes(extension) || expectedMime !== file.type) {
    return {
      code: 'MIME_EXTENSION_MISMATCH',
      message: strings['errors.allegati.mimeExtensionMismatch'],
    }
  }

  try {
    sanitizeFilename(file.name)
  } catch {
    return getFileNameError()
  }

  const header = await readFileHeader(file.uri)
  const expectedSignature = EXTENSION_TO_SIGNATURE[extension]
  if (!matchesSignature(header, expectedSignature)) {
    return {
      code: 'MIME_EXTENSION_MISMATCH',
      message: strings['errors.allegati.mimeExtensionMismatch'],
    }
  }

  return null
}

export async function uploadAttachment(
  userId: string,
  transazioneId: string,
  file: AttachmentFileInput,
): Promise<AttachmentUploadResult> {
  const validationError = await validateAttachmentFile(file)
  if (validationError) {
    throw new Error(validationError.message)
  }

  const safeFilename = sanitizeFilename(file.name)
  const storagePath = `${userId}/${transazioneId}/${buildUuid()}-${safeFilename}`
  let fileBuffer: ArrayBuffer
  try {
    fileBuffer = await readFileAsArrayBuffer(file.uri)
  } catch {
    throw new Error(strings['errors.allegati.uploadFailed'])
  }

  const { error } = await supabase
    .storage
    .from(ATTACHMENTS_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    throw new Error(strings['errors.allegati.uploadFailed'])
  }

  return {
    storagePath,
    fileName: file.name,
    mimeType: file.type as AttachmentMimeType,
    sizeBytes: file.size,
  }
}

export async function deleteAttachment(storagePath: string): Promise<void> {
  const { error } = await supabase
    .storage
    .from(ATTACHMENTS_BUCKET)
    .remove([storagePath])

  if (error) {
    throw new Error(strings['errors.allegati.deleteFailed'])
  }
}

export async function getAttachmentSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase
    .storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)

  if (error) {
    throw new Error(strings['allegati.upload.signedUrlFailed'])
  }
  if (!data?.signedUrl) {
    throw new Error(strings['errors.allegati.accessFailed'])
  }

  return data.signedUrl
}