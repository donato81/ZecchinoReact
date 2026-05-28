/**
 * Placeholder spec for DESIGN 016 and PLAN 016.
 * Implementation is intentionally deferred; only TODO scenarios are tracked here.
 */
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    storage: {
      from: jest.fn(),
    },
  },
}))

import { deleteAttachment, getAttachmentSignedUrl, uploadAttachment, validateAttachmentFile } from '@/lib/supabase/storage'
import { supabase } from '@/lib/supabase/client'

const mockFrom = supabase.storage.from as jest.Mock

function buildStorageBucket() {
  return {
    upload: jest.fn(),
    remove: jest.fn(),
    createSignedUrl: jest.fn(),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: jest.fn(() => 'uuid-016'),
      getRandomValues: jest.fn(),
    },
    configurable: true,
  })
})

describe('allegati.storage', () => {
  it('sanitizeFilename produce un path sicuro per nomi file pericolosi', async () => {
    const bucket = buildStorageBucket()
    bucket.upload.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue(bucket)
    globalThis.fetch = jest.fn().mockResolvedValue({
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    }) as unknown as typeof fetch

    const result = await uploadAttachment('user-016', 'tx-016', {
      uri: 'file:///dangerous.pdf',
      name: '../Bilancio Finale 2026!!.PDF',
      type: 'application/pdf',
      size: 1024,
    })

    expect(result.storagePath).toBe('user-016/tx-016/uuid-016-bilancio-finale-2026.pdf')
    expect(bucket.upload).toHaveBeenCalledWith(
      'user-016/tx-016/uuid-016-bilancio-finale-2026.pdf',
      expect.any(ArrayBuffer),
      expect.objectContaining({ contentType: 'application/pdf', upsert: false }),
    )
  })

  it('validateAttachmentFile rifiuta MIME spoofing quando estensione e MIME sono incoerenti', () => {
    expect(validateAttachmentFile({
      uri: 'file:///report.pdf',
      name: 'report.pdf',
      type: 'image/png',
      size: 1200,
    })).toEqual({
      code: 'MIME_EXTENSION_MISMATCH',
      message: 'Estensione e tipo file non sono coerenti.',
    })
  })

  it('validateAttachmentFile rifiuta file oltre MAX_ATTACHMENT_SIZE_BYTES', () => {
    expect(validateAttachmentFile({
      uri: 'file:///large.pdf',
      name: 'large.pdf',
      type: 'application/pdf',
      size: 10 * 1024 * 1024 + 1,
    })).toEqual({
      code: 'SIZE_LIMIT_EXCEEDED',
      message: 'Il file supera il limite massimo di 10 MB.',
    })
  })

  it('uploadAttachment genera path fisico nel formato {user_id}/{transazione_id}/{uuid}-{safe_filename}', async () => {
    const bucket = buildStorageBucket()
    bucket.upload.mockResolvedValue({ error: null })
    bucket.createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://signed.local/file' }, error: null })
    bucket.remove.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue(bucket)
    globalThis.fetch = jest.fn().mockResolvedValue({
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
    }) as unknown as typeof fetch

    const uploadResult = await uploadAttachment('user-016', 'tx-016', {
      uri: 'file:///foto.jpg',
      name: 'Foto Vacanze.JPG',
      type: 'image/jpeg',
      size: 2048,
    })

    await expect(getAttachmentSignedUrl(uploadResult.storagePath)).resolves.toBe('https://signed.local/file')
    await expect(deleteAttachment(uploadResult.storagePath)).resolves.toBeUndefined()
    expect(uploadResult.storagePath).toBe('user-016/tx-016/uuid-016-foto-vacanze.jpg')
  })
})