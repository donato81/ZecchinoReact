// src/announcements/accounts.ts
// Funzioni per conti, movimenti, trasferimenti, export/import.
// Accettano sempre tipi di dominio grezzi (numeri, stringhe), mai stringhe pre-formattate.
import type { Announcement } from './types'
import { t } from './_utils/t'
import { formatCurrencyVocal } from './_utils/currency'
import { pluralize } from './_utils/plurals'
import type { ExportFailureReason } from '@/lib/export-service'

function build(text: string, priority: Announcement['priority'] = 'polite'): Announcement {
  return { text, priority }
}

export function announceAccountCreated(
  name: string,
  type: string,
  initialBalance: number,
): Announcement {
  return build(
    t('conto_creato', {
      name,
      type,
      amount: formatCurrencyVocal(initialBalance),
    }),
  )
}

export function announceAccountModified(name: string): Announcement {
  return build(t('conto_modificato', { name }))
}

export function announceAccountDeleted(name: string, hadTransactions: boolean): Announcement {
  if (hadTransactions) {
    return build(t('conto_eliminato_con_movimenti', { name }))
  }
  return build(t('conto_eliminato', { name }))
}

export function announceAccountDeletedGeneric(): Announcement {
  return build(t('conto_eliminato_generico'))
}

export function announceTransaction(
  type: string,
  amount: number,
  accountName: string,
): Announcement {
  return build(
    t('movimento_aggiunto', {
      type,
      amount: formatCurrencyVocal(amount),
      name: accountName,
    }),
  )
}

export function announceTransactionModified(): Announcement {
  return build(t('movimento_modificato'))
}

export function announceTransactionDeleted(): Announcement {
  return build(t('movimento_eliminato'))
}

export function announceTransfer(amount: number, from: string, to: string): Announcement {
  return build(
    t('trasferimento_completato', {
      amount: formatCurrencyVocal(amount),
      from,
      to,
    }),
  )
}

export function announceAccountBalance(name: string, balance: number): Announcement {
  return build(t('saldo_conto', { name, amount: formatCurrencyVocal(balance) }))
}

export function announceRecentTransactions(count: number): Announcement {
  return build(
    t('movimenti_recenti', {
      count,
      plural_movimento: pluralize('movimento', count),
    }),
  )
}

export function announceExportCSV(count: number): Announcement {
  return build(
    t('export_csv_completato', {
      count,
      plural_movimento: pluralize('movimento', count),
    }),
  )
}

export function announceExport(count: number): Announcement {
  return build(
    t('export_completato', {
      count,
      plural_elemento: pluralize('elemento', count),
    }),
  )
}

export function announceImportComplete(count: number): Announcement {
  return build(
    t('import_completato', {
      count,
      plural_elemento: pluralize('elemento', count),
    }),
  )
}

export function announceExportInProgress(): Announcement {
  return build(t('export_in_corso'))
}

export function announceExportFile(_count: number): Announcement {
  return build(t('export_success_sr'))
}

export function exportError(
  reason: Exclude<ExportFailureReason, 'CANCELLED'>,
): Announcement {
  switch (reason) {
    case 'ALREADY_IN_PROGRESS':
      return build(t('export_already_in_progress_sr'))
    case 'PERMISSION_DENIED':
      return build(t('export_permission_denied_sr'))
    case 'FILESYSTEM_ERROR':
      return build(t('export_filesystem_error_sr'))
    case 'UNSUPPORTED_PLATFORM':
      return build(t('export_unsupported_platform_sr'))
    case 'INVALID_PATH':
      return build(t('export_invalid_path_sr'))
    case 'INSUFFICIENT_SPACE':
      return build(t('export_insufficient_space_sr'))
    case 'UNKNOWN':
    default:
      return build(t('export_unknown_error_sr'))
  }
}
