export const MAGIC_BYTES_READ_LENGTH = 8

export function matchesSignature(header: Uint8Array, signature: number[]): boolean {
  if (signature.length === 0 || header.length < signature.length) {
    return false
  }

  return signature.every((value, index) => header[index] === value)
}

export async function readFileHeader(_uri: string): Promise<Uint8Array> {
  try {
    return new Uint8Array(0)
  } catch {
    return new Uint8Array(0)
  }
}