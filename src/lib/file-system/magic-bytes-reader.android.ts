const MAGIC_BYTES_READ_LENGTH = 8;

type FsModule = {
  read?: (
    path: string,
    length: number,
    position: number,
    encoding: 'base64',
  ) => Promise<string>;
  readFile: (path: string, encoding: 'base64') => Promise<string>;
};

function loadFsModule(): FsModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    return require('react-native-fs') as FsModule;
  } catch {
    return null;
  }
}

function normalizeFileUri(uri: string): string {
  return uri.startsWith('file://') ? uri.slice('file://'.length) : uri;
}

function decodeBase64(base64: string): Uint8Array {
  const g = globalThis as typeof globalThis & {
    Buffer?: { from(str: string, enc: string): Uint8Array };
  };
  if (g.Buffer) {
    return new Uint8Array(g.Buffer.from(base64, 'base64')).slice(
      0,
      MAGIC_BYTES_READ_LENGTH,
    );
  }

  const binary = atob(base64);
  return Uint8Array.from(binary, char => char.charCodeAt(0)).slice(
    0,
    MAGIC_BYTES_READ_LENGTH,
  );
}

export async function readFileHeader(uri: string): Promise<Uint8Array> {
  try {
    const fsModule = loadFsModule();
    if (!fsModule) {
      return new Uint8Array(0);
    }

    const base64 =
      typeof fsModule.read === 'function'
        ? await fsModule.read(
            normalizeFileUri(uri),
            MAGIC_BYTES_READ_LENGTH,
            0,
            'base64',
          )
        : await fsModule.readFile(normalizeFileUri(uri), 'base64');
    return decodeBase64(base64);
  } catch {
    return new Uint8Array(0);
  }
}
