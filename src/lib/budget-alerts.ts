import { Budget, Transaction } from './types'
import { formatCurrency, getBudgetProgress } from './helpers'
import { t } from '@/announcements/_utils/t'

export type BudgetAlertLevel = 'info' | 'warning' | 'critical' | 'exceeded'

export interface BudgetAlert {
  budgetId: string
  budgetName: string
  level: BudgetAlertLevel
  percentage: number
  spent: number
  target: number
  remaining: number
  message: string
  timestamp: string
}

export function getBudgetAlertLevel(percentage: number, isOverBudget: boolean): BudgetAlertLevel {
  if (isOverBudget) return 'exceeded'
  if (percentage >= 90) return 'critical'
  if (percentage >= 75) return 'warning'
  return 'info'
}

export function getBudgetAlertMessage(
  budgetName: string,
  level: BudgetAlertLevel,
  percentage: number,
  remaining: number,
  spent: number,
  target: number
): string {
  const percentageRounded = Math.round(percentage)

  switch (level) {
    case 'exceeded':
      return t('notifiche.budget.superato', {
        name: budgetName,
        spent: formatCurrency(spent),
        target: formatCurrency(target),
      })
    case 'critical':
      return t('budget_critico', {
        name: budgetName,
        percent: percentageRounded,
        remaining: formatCurrency(remaining),
      })
    case 'warning':
      return t('notifiche.budget.soglia', {
        name: budgetName,
        percent: percentageRounded,
      })
    case 'info':
      return t('budget_normale', {
        name: budgetName,
        percent: percentageRounded,
      })
  }
}

export function generateBudgetAlerts(
  budgets: Budget[],
  transactions: Transaction[]
): BudgetAlert[] {
  const alerts: BudgetAlert[] = []
  const now = new Date()
  
  const activeBudgets = budgets.filter(budget => {
    if (!budget.attivo) return false
    const endDate = new Date(budget.dataFine)
    return endDate >= now
  })
  
  for (const budget of activeBudgets) {
    const { spent, percentage, remaining, isOverBudget } = getBudgetProgress(budget, transactions)
    const level = getBudgetAlertLevel(percentage, isOverBudget)
    
    if (level === 'exceeded' || level === 'critical' || level === 'warning') {
      alerts.push({
        budgetId: budget.id,
        budgetName: budget.nome,
        level,
        percentage,
        spent,
        target: budget.importoTarget,
        remaining,
        message: getBudgetAlertMessage(budget.nome, level, percentage, remaining, spent, budget.importoTarget),
        timestamp: new Date().toISOString()
      })
    }
  }
  
  return alerts.sort((a, b) => {
    const levelOrder = { exceeded: 0, critical: 1, warning: 2, info: 3 }
    return levelOrder[a.level] - levelOrder[b.level]
  })
}

export function shouldShowBudgetNotification(
  budget: Budget,
  previousPercentage: number,
  currentPercentage: number
): { shouldShow: boolean; level: BudgetAlertLevel | null } {
  const thresholds = [75, 90, 100]
  
  for (const threshold of thresholds) {
    if (previousPercentage < threshold && currentPercentage >= threshold) {
      const isOverBudget = currentPercentage >= 100
      return {
        shouldShow: true,
        level: getBudgetAlertLevel(currentPercentage, isOverBudget)
      }
    }
  }
  
  return { shouldShow: false, level: null }
}

export function getBudgetNotificationTitle(level: BudgetAlertLevel): string {
  switch (level) {
    case 'exceeded':
      return t('notifiche.budget.titolo.exceeded')
    case 'critical':
      return t('notifiche.budget.titolo.critical')
    case 'warning':
      return t('notifiche.budget.titolo.warning')
    case 'info':
      return t('notifiche.budget.titolo.warning')
  }
}

export function getAlertIconColor(level: BudgetAlertLevel): string {
  switch (level) {
    case 'exceeded':
      return 'text-destructive'
    case 'critical':
      return 'text-amber-500'
    case 'warning':
      return 'text-yellow-500'
    case 'info':
      return 'text-accent'
  }
}
