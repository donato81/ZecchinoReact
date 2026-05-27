type PlatformName = 'ios' | 'android' | 'windows' | 'web'

type ExportServiceModule = typeof import('@/lib/export-service')

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function loadExportService(platform: PlatformName): {
  exportFile: ExportServiceModule['exportFile']
  mockShareOpen: jest.Mock
  mockWriteFile: jest.Mock
  mockPickSavePath: jest.Mock
} {
  jest.resetModules()

  const mockShareOpen = jest.fn()
  const mockWriteFile = jest.fn()
  const mockPickSavePath = jest.fn()

  jest.doMock('react-native', () => ({
    Platform: { OS: platform },
  }))

  jest.doMock('react-native-share', () => ({
    __esModule: true,
    default: { open: mockShareOpen },
  }))

  jest.doMock('@react-native-windows/fs', () => ({
    writeFile: mockWriteFile,
  }))

  jest.doMock('@/native', () => ({
    WinRTSavePicker: {
      pickSavePath: mockPickSavePath,
    },
  }))

  const { exportFile } = require('@/lib/export-service') as ExportServiceModule

  return { exportFile, mockShareOpen, mockWriteFile, mockPickSavePath }
}

describe('ExportService — PLAN 012', () => {
  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('1. Successo: export completato con esito { success: true }', async () => {
    const { exportFile, mockShareOpen } = loadExportService('ios')
    mockShareOpen.mockResolvedValue(undefined)

    await expect(exportFile('a,b\n1,2', 'export.csv', 'text/csv')).resolves.toEqual({ success: true })
  })

  it('2. CANCELLED: cancellazione utente mappata correttamente', async () => {
    const { exportFile, mockShareOpen } = loadExportService('ios')
    mockShareOpen.mockRejectedValue(new Error('User did not share'))

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'CANCELLED',
    })
  })

  it('3. PERMISSION_DENIED: errore permessi mappato correttamente', async () => {
    const { exportFile, mockPickSavePath, mockWriteFile } = loadExportService('windows')
    mockPickSavePath.mockResolvedValue({ status: 'SUCCESS', path: 'C:\\protected\\export.csv' })
    mockWriteFile.mockRejectedValue(new Error('EACCES: permission denied'))

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'PERMISSION_DENIED',
    })
  })

  it('4. FILESYSTEM_ERROR: errore di scrittura generico mappato correttamente', async () => {
    const { exportFile, mockPickSavePath, mockWriteFile } = loadExportService('windows')
    mockPickSavePath.mockResolvedValue({ status: 'SUCCESS', path: 'C:\\temp\\export.csv' })
    mockWriteFile.mockRejectedValue(new Error('write failed unexpectedly'))

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'FILESYSTEM_ERROR',
    })
  })

  it('5. UNSUPPORTED_PLATFORM: piattaforma non supportata mappata correttamente', async () => {
    const { exportFile } = loadExportService('web')

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'UNSUPPORTED_PLATFORM',
    })
  })

  it('6. INVALID_PATH: percorso non valido mappato correttamente', async () => {
    const { exportFile, mockPickSavePath } = loadExportService('windows')
    mockPickSavePath.mockResolvedValue({ status: 'INTERNAL_ERROR', code: 'INVALID_FILENAME' })

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'INVALID_PATH',
    })
  })

  it('7. INSUFFICIENT_SPACE: spazio insufficiente mappato correttamente', async () => {
    const { exportFile, mockPickSavePath, mockWriteFile } = loadExportService('windows')
    mockPickSavePath.mockResolvedValue({ status: 'SUCCESS', path: 'C:\\temp\\export.csv' })
    mockWriteFile.mockRejectedValue(new Error('ENOSPC: no space left on device'))

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'INSUFFICIENT_SPACE',
    })
  })

  it('8. UNKNOWN: errore sconosciuto mappato correttamente', async () => {
    const { exportFile, mockShareOpen } = loadExportService('android')
    mockShareOpen.mockRejectedValue(new Error('kaboom'))

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'UNKNOWN',
    })
  })

  it('9. ALREADY_IN_PROGRESS: seconda invocazione immediata respinta', async () => {
    const { exportFile, mockShareOpen } = loadExportService('ios')
    const pending = deferred<void>()
    mockShareOpen.mockReturnValueOnce(pending.promise)

    const first = exportFile('contenuto', 'export.csv', 'text/csv')
    const second = await exportFile('contenuto', 'export.csv', 'text/csv')

    expect(second).toEqual({ success: false, reason: 'ALREADY_IN_PROGRESS' })

    pending.resolve(undefined)
    await expect(first).resolves.toEqual({ success: true })
  })

  it('10. Test concorrente: solo la prima chiamata procede', async () => {
    const { exportFile, mockShareOpen } = loadExportService('ios')
    const pending = deferred<void>()
    mockShareOpen.mockReturnValueOnce(pending.promise)

    const first = exportFile('contenuto', 'export.csv', 'text/csv')
    const second = exportFile('contenuto', 'export.csv', 'text/csv')

    await expect(second).resolves.toEqual({ success: false, reason: 'ALREADY_IN_PROGRESS' })
    expect(mockShareOpen).toHaveBeenCalledTimes(1)

    pending.resolve(undefined)
    await expect(first).resolves.toEqual({ success: true })
  })

  it('11. Cleanup finally: il flag viene rilasciato dopo un fallimento', async () => {
    const { exportFile, mockShareOpen } = loadExportService('ios')
    mockShareOpen.mockRejectedValueOnce(new Error('kaboom'))
    mockShareOpen.mockResolvedValueOnce(undefined)

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'UNKNOWN',
    })

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({ success: true })
  })

  it('12. Errore non Error: throw arbitrario non lascia il flag bloccato', async () => {
    const { exportFile, mockShareOpen } = loadExportService('ios')
    mockShareOpen.mockRejectedValueOnce('BOOM')
    mockShareOpen.mockResolvedValueOnce(undefined)

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'UNKNOWN',
    })

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({ success: true })
  })

  it('13. Reset flag completo: export A termina, B viene respinto, export C parte normalmente', async () => {
    const { exportFile, mockShareOpen } = loadExportService('ios')
    const pending = deferred<void>()
    mockShareOpen.mockReturnValueOnce(pending.promise)
    mockShareOpen.mockResolvedValueOnce(undefined)

    const exportA = exportFile('contenuto', 'export-a.csv', 'text/csv')
    const exportB = exportFile('contenuto', 'export-b.csv', 'text/csv')

    await expect(exportB).resolves.toEqual({ success: false, reason: 'ALREADY_IN_PROGRESS' })

    pending.resolve(undefined)
    await expect(exportA).resolves.toEqual({ success: true })

    await expect(exportFile('contenuto', 'export-c.csv', 'text/csv')).resolves.toEqual({ success: true })
    expect(mockShareOpen).toHaveBeenCalledTimes(2)
  })
})
