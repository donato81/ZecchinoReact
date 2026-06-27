export const MAGIC_BYTES_READ_LENGTH = 12;

export function matchesSignature(
  header: Uint8Array,
  signature: number[],
): boolean {
  if (signature.length === 0 || header.length < signature.length) {
    return false;
  }

  // Rilevamento WEBP (lunghezza 12, RIFF + WEBP)
  const isWebpSignature =
    signature.length === 12 &&
    signature[0] === 0x52 &&
    signature[1] === 0x49 &&
    signature[2] === 0x46 &&
    signature[3] === 0x46 &&
    signature[8] === 0x57 &&
    signature[9] === 0x45 &&
    signature[10] === 0x42 &&
    signature[11] === 0x50;

  if (isWebpSignature) {
    return (
      header.length >= 12 &&
      header[0] === 0x52 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x46 &&
      header[8] === 0x57 &&
      header[9] === 0x45 &&
      header[10] === 0x42 &&
      header[11] === 0x50
    );
  }

  // Rilevamento HEIC (lunghezza >= 8, ftyp a partire da byte 4)
  const isHeicSignature =
    signature.length >= 8 &&
    signature[4] === 0x66 &&
    signature[5] === 0x74 &&
    signature[6] === 0x79 &&
    signature[7] === 0x70;

  if (isHeicSignature) {
    if (header.length < 12) {
      return false;
    }
    // Controllo ftyp: byte 4-7 = 66 74 79 70 ("ftyp")
    const hasFtyp =
      header[4] === 0x66 &&
      header[5] === 0x74 &&
      header[6] === 0x79 &&
      header[7] === 0x70;
    if (!hasFtyp) {
      return false;
    }

    // Controllo brand: byte 8-11
    // heic: 68 65 69 63 (heic)
    // heix: 68 65 69 78 (heix)
    // mif1: 6d 69 66 31 (mif1)
    // msf1: 6d 73 66 31 (msf1)
    const brandBytes = [header[8], header[9], header[10], header[11]];
    const matchesBrand = (expected: number[]) =>
      expected.every((val, idx) => brandBytes[idx] === val);

    const isBrandValid =
      matchesBrand([0x68, 0x65, 0x69, 0x63]) || // heic
      matchesBrand([0x68, 0x65, 0x69, 0x78]) || // heix
      matchesBrand([0x6d, 0x69, 0x66, 0x31]) || // mif1
      matchesBrand([0x6d, 0x73, 0x66, 0x31]);   // msf1

    return isBrandValid;
  }

  // Fallback per JPEG, PNG, PDF
  return signature.every((value, index) => header[index] === value);
}

export async function readFileHeader(_uri: string): Promise<Uint8Array> {
  try {
    return new Uint8Array(0);
  } catch {
    return new Uint8Array(0);
  }
}
