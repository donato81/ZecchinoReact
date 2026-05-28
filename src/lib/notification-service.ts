import {
  cleanupReadExpiredBefore,
  create as createNotification,
  existsUnreadForEntityLevel,
  getAll as getAllNotifications,
  getUnreadByEntity,
  markAllAsRead,
  removeExpired,
} from '@/lib/supabase/repositories/notifiche'
import { getActiveBudgets, getBudgetProgress } from '@/lib/helpers'
import { getBudgetAlertMessage, getBudgetNotificationTitle, shouldShowBudgetNotification } from '@/lib/budget-alerts'
import type { AppNotification, Budget, Transaction } from '@/lib/types'

type BudgetLevel = 'warning' | 'critical' | 'exceeded'

function getThresholdForLevel(level: BudgetLevel): number {
  switch (level) {
    case 'warning':
      return 75
    case 'critical':
      return 90
    case 'exceeded':
      return 100
  }
}

function getBudgetPeriodKey(budget: Budget): string {
  return `${budget.dataInizio.slice(0, 10)}:${budget.dataFine.slice(0, 10)}`
}

export function createNotificationService() {
  let budgetPercentages: Record<string, number> = {}

  return {
    reset(): void {
      budgetPercentages = {}
    },

    async hydrateUnreadNotifications(): Promise<AppNotification[]> {
      const notifications = await getAllNotifications()
      return notifications.filter((notification) => !notification.letta)
    },

    async cleanupReadyNotifications(now = new Date()): Promise<void> {
      await removeExpired(now.toISOString())
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      await cleanupReadExpiredBefore(cutoff)
    },

    async processBudgetNotifications(params: {
      budgets: Budget[]
      transactions: Transaction[]
    }): Promise<AppNotification[]> {
      const createdNotifications: AppNotification[] = []
      const activeBudgets = getActiveBudgets(params.budgets)
      const nextPercentages: Record<string, number> = { ...budgetPercentages }

      for (const budget of activeBudgets) {
        const { spent, percentage, remaining } = getBudgetProgress(budget, params.transactions)
        const budgetPeriodKey = getBudgetPeriodKey(budget)
        const percentageStateKey = `${budget.id}:${budgetPeriodKey}`
        const previousPercentage = budgetPercentages[percentageStateKey] ?? 0
        const { shouldShow, level } = shouldShowBudgetNotification(budget, previousPercentage, percentage)

        nextPercentages[percentageStateKey] = percentage

        if (!shouldShow || !level || level === 'info') {
          continue
        }

        const budgetLevel = level as BudgetLevel
        const alreadyExists = await existsUnreadForEntityLevel({
          entitaTipo: 'budget',
          entitaId: budget.id,
          level: budgetLevel,
          budgetPeriodKey,
        })

        if (alreadyExists) {
          continue
        }

        const unreadForBudget = await getUnreadByEntity({
          entitaTipo: 'budget',
          entitaId: budget.id,
          budgetPeriodKey,
        })

        if (unreadForBudget.length > 0) {
          await markAllAsRead({
            entitaTipo: 'budget',
            entitaId: budget.id,
            budgetPeriodKey,
          })
        }

        createdNotifications.push(
          await createNotification({
            tipo: budgetLevel === 'exceeded' ? 'budget_superato' : 'budget_soglia',
            titolo: getBudgetNotificationTitle(budgetLevel),
            messaggio: getBudgetAlertMessage(
              budget.nome,
              budgetLevel,
              percentage,
              remaining,
              spent,
              budget.importoTarget,
            ),
            entitaTipo: 'budget',
            entitaId: budget.id,
            metadata: {
              level: budgetLevel,
              percentage,
              threshold: getThresholdForLevel(budgetLevel),
              budgetPeriodKey,
            },
          }),
        )
      }

      budgetPercentages = nextPercentages
      return createdNotifications
    },
  }
}