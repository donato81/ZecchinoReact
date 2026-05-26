type PlatformName = 'ios' | 'android' | 'windows' | 'web'

type ExportServiceModule = typeof import('@/lib/export-service')

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

describe('ExportService', () => {
  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('success iOS -> { success: true } via share sheet', async () => {
    const { exportFile, mockShareOpen } = loadExportService('ios')
    mockShareOpen.mockResolvedValue(undefined)

    await expect(exportFile('a,b\n1,2', 'export.csv', 'text/csv')).resolves.toEqual({
      success: true,
    })

    expect(mockShareOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'export.csv',
        type: 'text/csv',
        failOnCancel: false,
        url: expect.stringContaining('data:text/csv;base64,'),
      }),
    )
  })

  it('success Android -> { success: true } via share sheet', async () => {
    const { exportFile, mockShareOpen } = loadExportService('android')
    mockShareOpen.mockResolvedValue(undefined)

    await expect(exportFile('contenuto', 'backup.csv', 'text/csv')).resolves.toEqual({
      success: true,
    })
  })

  it('success Windows -> { success: true } via save picker', async () => {
    const { exportFile, mockPickSavePath, mockWriteFile } = loadExportService('windows')
    mockPickSavePath.mockResolvedValue({ status: 'SUCCESS', path: 'C:\\Users\\test\\export.csv' })
    mockWriteFile.mockResolvedValue(undefined)

    await expect(exportFile('a,b\n1,2', 'export.csv', 'text/csv')).resolves.toEqual({
      success: true,
    })

    expect(mockWriteFile).toHaveBeenCalledWith('C:\\Users\\test\\export.csv', 'a,b\n1,2', 'utf8')
  })

  it('cancelled mobile -> { success: false, reason: CANCELLED }', async () => {
    const { exportFile, mockShareOpen } = loadExportService('ios')
    mockShareOpen.mockRejectedValue(new Error('User did not share'))

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'CANCELLED',
    })
  })

  it('cancelled Windows -> { success: false, reason: CANCELLED }', async () => {
    const { exportFile, mockPickSavePath, mockWriteFile } = loadExportService('windows')
    mockPickSavePath.mockResolvedValue({ status: 'USER_CANCELLED' })

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'CANCELLED',
    })

    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('permission denied -> { success: false, reason: PERMISSION_DENIED }', async () => {
    const { exportFile, mockPickSavePath, mockWriteFile } = loadExportService('windows')
    mockPickSavePath.mockResolvedValue({ status: 'SUCCESS', path: 'C:\\protected\\export.csv' })
    mockWriteFile.mockRejectedValue(new Error('EACCES: permission denied'))

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'PERMISSION_DENIED',
    })
  })

  it('filesystem error -> { success: false, reason: FILESYSTEM_ERROR }', async () => {
    const { exportFile, mockPickSavePath, mockWriteFile } = loadExportService('windows')
    mockPickSavePath.mockResolvedValue({ status: 'SUCCESS', path: 'C:\\temp\\export.csv' })
    mockWriteFile.mockRejectedValue(new Error('write failed unexpectedly'))

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'FILESYSTEM_ERROR',
    })
  })

  it('insufficient space Windows -> { success: false, reason: INSUFFICIENT_SPACE }', async () => {
    const { exportFile, mockPickSavePath, mockWriteFile } = loadExportService('windows')
    mockPickSavePath.mockResolvedValue({ status: 'SUCCESS', path: 'C:\\temp\\export.csv' })
    mockWriteFile.mockRejectedValue(new Error('ENOSPC: no space left on device'))

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'INSUFFICIENT_SPACE',
    })
  })

  it('invalid path Windows -> { success: false, reason: INVALID_PATH }', async () => {
    const { exportFile, mockPickSavePath, mockWriteFile } = loadExportService('windows')
    mockPickSavePath.mockResolvedValue({ status: 'INTERNAL_ERROR', code: 'INVALID_FILENAME' })

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'INVALID_PATH',
    })

    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('unsupported platform -> { success: false, reason: UNSUPPORTED_PLATFORM }', async () => {
    const { exportFile, mockShareOpen, mockWriteFile, mockPickSavePath } = loadExportService('web')

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'UNSUPPORTED_PLATFORM',
    })

    expect(mockShareOpen).not.toHaveBeenCalled()
    expect(mockWriteFile).not.toHaveBeenCalled()
    expect(mockPickSavePath).not.toHaveBeenCalled()
  })

  it('unknown error -> { success: false, reason: UNKNOWN }', async () => {
    const { exportFile, mockShareOpen } = loadExportService('android')
    mockShareOpen.mockRejectedValue(new Error('kaboom'))

    await expect(exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'UNKNOWN',
    })
  })

  it('does not throw for documented error scenarios', async () => {
    const ios = loadExportService('ios')
    ios.mockShareOpen.mockRejectedValue(new Error('User did not share'))
    await expect(ios.exportFile('contenuto', 'ios.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'CANCELLED',
    })

    const windowsPermission = loadExportService('windows')
    windowsPermission.mockPickSavePath.mockResolvedValue({
      status: 'SUCCESS',
      path: 'C:\\protected\\export.csv',
    })
    windowsPermission.mockWriteFile.mockRejectedValue(new Error('EACCES: permission denied'))
    await expect(
      windowsPermission.exportFile('contenuto', 'export.csv', 'text/csv'),
    ).resolves.toEqual({ success: false, reason: 'PERMISSION_DENIED' })

    const windowsUnknown = loadExportService('windows')
    windowsUnknown.mockPickSavePath.mockRejectedValue(new Error('BRIDGE_REJECT'))
    await expect(
      windowsUnknown.exportFile('contenuto', 'export.csv', 'text/csv'),
    ).resolves.toEqual({ success: false, reason: 'UNKNOWN' })

    const unsupported = loadExportService('web')
    await expect(unsupported.exportFile('contenuto', 'export.csv', 'text/csv')).resolves.toEqual({
      success: false,
      reason: 'UNSUPPORTED_PLATFORM',
    })
  })
})
