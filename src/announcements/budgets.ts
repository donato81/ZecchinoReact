// src/announcements/budgets.ts
// Funzioni per budget e obiettivi di risparmio.
// announceBudgetStatus e announceSavingsGoalProgress sono composite con branching su soglie.
import type { Announcement } from './types';
import { t } from './_utils/t';
import { formatCurrencyVocal } from './_utils/currency';

function build(
  text: string,
  priority: Announcement['priority'] = 'polite',
): Announcement {
  return { text, priority };
}

export function announceBudgetCreated(
  name: string,
  target: number,
  period: string,
): Announcement {
  return build(
    t('budget_creato', {
      name,
      amount: formatCurrencyVocal(target),
      period,
    }),
  );
}

export function announceBudgetModified(name: string): Announcement {
  return build(t('budget_modificato', { name }));
}

export function announceBudgetDeleted(name: string): Announcement {
  return build(t('budget_eliminato', { name }));
}

export function announceBudgetDeletedGeneric(): Announcement {
  return build(t('budget_eliminato_generico'));
}

/**
 * Composite: ramificazione su percentuale spesa.
 * - >= 100%: superato (assertive)
 * - >= 90%: critico (assertive)
 * - >= 75%: attenzione (polite)
 * - < 75%:  normale (polite)
 */
export function announceBudgetStatus(
  name: string,
  spent: number,
  target: number,
): Announcement {
  if (target <= 0 && spent > 0) {
    return build(
      t('budget_superato', {
        name,
        spent: formatCurrencyVocal(spent),
        target: formatCurrencyVocal(target),
      }),
      'assertive',
    );
  }
  const percent = target > 0 ? Math.round((spent / target) * 100) : 0;
  const remaining = Math.max(target - spent, 0);
  if (percent >= 100) {
    return build(
      t('budget_superato', {
        name,
        spent: formatCurrencyVocal(spent),
        target: formatCurrencyVocal(target),
      }),
      'assertive',
    );
  }
  if (percent >= 90) {
    return build(
      t('budget_critico', {
        name,
        percent,
        remaining: formatCurrencyVocal(remaining),
      }),
      'assertive',
    );
  }
  if (percent >= 75) {
    return build(
      t('budget_attenzione', {
        name,
        percent,
        remaining: formatCurrencyVocal(remaining),
      }),
    );
  }
  return build(t('budget_normale', { name, percent }));
}

export function announceSavingsGoalCreated(
  name: string,
  target: number,
): Announcement {
  return build(
    t('obiettivo_creato', { name, amount: formatCurrencyVocal(target) }),
  );
}

export function announceSavingsGoalModified(name: string): Announcement {
  return build(t('obiettivo_modificato', { name }));
}

export function announceSavingsGoalDeleted(name: string): Announcement {
  return build(t('obiettivo_eliminato', { name }));
}

export function announceSavingsGoalDeletedGeneric(): Announcement {
  return build(t('obiettivo_eliminato_generico'));
}

/**
 * Composite: ramificazione su percentuale di completamento.
 * - >= 100%: completato
 * - >= 75%: quasi completato (con remaining)
 * - < 75%:  progresso normale
 */
export function announceSavingsGoalProgress(
  name: string,
  current: number,
  target: number,
): Announcement {
  const percent = target > 0 ? Math.round((current / target) * 100) : 0;
  const remaining = Math.max(target - current, 0);
  if (percent >= 100) {
    return build(t('obiettivo_completato', { name }));
  }
  if (percent >= 75) {
    return build(
      t('obiettivo_quasi_completato', {
        name,
        percent,
        remaining: formatCurrencyVocal(remaining),
      }),
    );
  }
  return build(t('obiettivo_progresso', { name, percent }));
}

export function announceCategoryCreated(name: string): Announcement {
  return build(t('categoria_creata', { name }));
}
