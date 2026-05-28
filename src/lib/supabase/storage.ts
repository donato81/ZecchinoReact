import { supabase } from './client'
import type {
  AttachmentFileInput,
  AttachmentMimeType,
  AttachmentUploadResult,
  AttachmentValidationError,
} from '../types'
import { strings } from '@/locales'

const ATTACHMENTS_BUCKET = 'allegati-transazioni'
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024
const SIGNED_URL_TTL_SECONDS = 60 * 5
const MIME_TO_EXTENSIONS: Record<AttachmentMimeType, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'application/pdf': ['pdf'],
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

function buildUuid(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
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

async function readFileAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri)
  return response.arrayBuffer()
}

export function validateAttachmentFile(file: AttachmentFileInput): AttachmentValidationError | null {
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

  if (!allowedExtensions.includes(extension)) {
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

  return null
}

export async function uploadAttachment(
  userId: string,
  transazioneId: string,
  file: AttachmentFileInput,
): Promise<AttachmentUploadResult> {
  const validationError = validateAttachmentFile(file)
  if (validationError) {
    throw new Error(validationError.message)
  }

  const safeFilename = sanitizeFilename(file.name)
  const storagePath = `${userId}/${transazioneId}/${buildUuid()}-${safeFilename}`
  const fileBuffer = await readFileAsArrayBuffer(file.uri)

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

  if (error || !data?.signedUrl) {
    throw new Error(error ? strings['allegati.upload.signedUrlFailed'] : strings['errors.allegati.accessFailed'])
  }

  return data.signedUrl
}