jest.mock('@/lib/helpers', () => ({
  getActiveBudgets: jest.fn((budgets: unknown) => budgets),
  getBudgetProgress: jest.fn(),
}))

jest.mock('@/lib/budget-alerts', () => ({
  shouldShowBudgetNotification: jest.fn(),
  getBudgetAlertMessage: jest.fn(() => 'Messaggio budget'),
  getBudgetNotificationTitle: jest.fn(() => 'Titolo budget'),
}))

jest.mock('@/lib/supabase/repositories/notifiche', () => ({
  getAll: jest.fn(),
  existsUnreadForEntityLevel: jest.fn(),
  getUnreadByEntity: jest.fn(),
  markAllAsRead: jest.fn(),
  create: jest.fn(),
  removeExpired: jest.fn(),
  cleanupReadExpiredBefore: jest.fn(),
}))

import { createNotificationService } from '@/lib/notification-service'
import { getBudgetProgress } from '@/lib/helpers'
import { shouldShowBudgetNotification } from '@/lib/budget-alerts'
import {
  create as createNotification,
  existsUnreadForEntityLevel,
  getUnreadByEntity,
  markAllAsRead,
} from '@/lib/supabase/repositories/notifiche'

const mockGetBudgetProgress = getBudgetProgress as jest.MockedFunction<typeof getBudgetProgress>
const mockShouldShowBudgetNotification = shouldShowBudgetNotification as jest.MockedFunction<typeof shouldShowBudgetNotification>
const mockCreateNotification = createNotification as jest.MockedFunction<typeof createNotification>
const mockExistsUnreadForEntityLevel = existsUnreadForEntityLevel as jest.MockedFunction<typeof existsUnreadForEntityLevel>
const mockGetUnreadByEntity = getUnreadByEntity as jest.MockedFunction<typeof getUnreadByEntity>
const mockMarkAllAsRead = markAllAsRead as jest.MockedFunction<typeof markAllAsRead>

beforeEach(() => {
  jest.clearAllMocks()
  mockGetBudgetProgress.mockReturnValue({ spent: 75, percentage: 75, remaining: 25, isOverBudget: false } as never)
  mockShouldShowBudgetNotification.mockReturnValue({ shouldShow: true, level: 'warning' })
  mockExistsUnreadForEntityLevel.mockResolvedValue(false)
  mockGetUnreadByEntity.mockResolvedValue([])
  mockCreateNotification.mockResolvedValue({
    id: 'notif-1',
    tipo: 'budget_soglia',
    titolo: 'Titolo budget',
    messaggio: 'Messaggio budget',
    letta: false,
    canale: 'inapp',
    entitaTipo: 'budget',
    entitaId: 'budget-1',
    metadata: { level: 'warning', percentage: 75, threshold: 75, budgetPeriodKey: '2026-06' },
    createdAt: '2026-06-01T10:00:00.000Z',
  } as never)
})

describe('notification-service', () => {
  it('deriva budgetPeriodKey dal riferimento locale della transazione e non dal mese UTC corrente', async () => {
    const service = createNotificationService()

    await service.processBudgetNotifications({
      budgets: [{ id: 'budget-1', nome: 'Casa', importoTarget: 100, attivo: true, dataInizio: '2026-04-01', dataFine: '2026-06-30', periodo: 'trimestrale' } as never],
      transactions: [{ id: 'tx-1', data: '2026-06-01' } as never],
    })

    expect(mockExistsUnreadForEntityLevel).toHaveBeenCalledWith(expect.objectContaining({ budgetPeriodKey: '2026-04-01:2026-06-30' }))
    expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({ budgetPeriodKey: '2026-04-01:2026-06-30' }),
    }))
  })

  it('marca come lette le notifiche precedenti dello stesso periodo prima di creare una escalation', async () => {
    const service = createNotificationService()
    mockShouldShowBudgetNotification.mockReturnValue({ shouldShow: true, level: 'critical' })
    mockGetUnreadByEntity.mockResolvedValue([{ id: 'notif-old', letta: false } as never])

    await service.processBudgetNotifications({
      budgets: [{ id: 'budget-1', nome: 'Casa', importoTarget: 100, attivo: true, dataInizio: '2026-01-01', dataFine: '2026-12-31', periodo: 'annuale' } as never],
      transactions: [{ id: 'tx-1', data: '2026-06-15' } as never],
    })

    expect(mockMarkAllAsRead).toHaveBeenCalledWith({
      entitaTipo: 'budget',
      entitaId: 'budget-1',
      budgetPeriodKey: '2026-01-01:2026-12-31',
    })
  })

  it('mantiene lo stato soglie separato per budget-periodo nella stessa sessione', async () => {
    const service = createNotificationService()
    mockShouldShowBudgetNotification
      .mockReturnValueOnce({ shouldShow: true, level: 'warning' })
      .mockReturnValueOnce({ shouldShow: true, level: 'warning' })

    await service.processBudgetNotifications({
      budgets: [{ id: 'budget-1', nome: 'Casa', importoTarget: 100, attivo: true, dataInizio: '2026-01-01', dataFine: '2026-03-31', periodo: 'trimestrale' } as never],
      transactions: [{ id: 'tx-1', data: '2026-02-15' } as never],
    })

    await service.processBudgetNotifications({
      budgets: [{ id: 'budget-1', nome: 'Casa', importoTarget: 100, attivo: true, dataInizio: '2026-04-01', dataFine: '2026-06-30', periodo: 'trimestrale' } as never],
      transactions: [{ id: 'tx-2', data: '2026-04-10' } as never],
    })

    expect(mockShouldShowBudgetNotification).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      0,
      75,
    )
    expect(mockShouldShowBudgetNotification).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      0,
      75,
    )
  })
})