import type { AccountCategoryInfo } from '@/lib/constants'

export type AccountType = 'bancario' | 'prepagata' | 'contanti' | 'salvadanaio' | 'privato' | 'investimenti' | 'credito' | 'paypal' | 'crypto' | 'pensione'

export type TransactionType = 'entrata' | 'uscita' | 'trasferimento'

export type RecurrenceType = 'entrata' | 'uscita'

export type RecurrenceFrequency = 'giornaliero' | 'settimanale' | 'mensile' | 'annuale'

export type CategoryType = 'entrata' | 'uscita'

export interface Account {
  id: string
  nome: string
  tipo: AccountType
  saldoIniziale: number
  valuta: string
  isPrivato: boolean
  dataCreazione: string
  archiviato: boolean
}

export interface Transaction {
  id: string
  data: string
  importo: number
  tipo: TransactionType
  contoId: string
  contoDestinazioneId?: string
  categoriaId: string
  descrizione: string
  ricorrente: boolean
  frequenzaRicorrenza?: RecurrenceFrequency
  cifrato: boolean
}

export type TransactionInput = Omit<Transaction, 'id' | 'cifrato'> & { id?: string }

export interface Recurrence {
  id: string
  contoId: string
  categoriaId?: string
  tipo: RecurrenceType
  importo: number
  descrizione: string
  frequenza: RecurrenceFrequency
  dataInizio: string
  dataFine?: string
  ultimaGenerazione?: string
  prossimaGenerazione: string
  attiva: boolean
}

export interface Tag {
  id: string
  nome: string
  colore?: string
  icona?: string
  usatoNVolte: number
}

export type NotificationType = 'budget_soglia' | 'budget_superato' | 'obiettivo_raggiunto' | 'sistema'

export type NotificationChannel = 'inapp' | 'email' | 'push'

export type NotificationEntityType = 'budget' | 'obiettivo' | 'conto' | 'transazione'

export interface AppNotificationMetadata {
  level?: 'warning' | 'critical' | 'exceeded'
  percentage?: number
  threshold?: number
  budgetPeriodKey?: string
}

export interface AppNotification {
  id: string
  tipo: NotificationType
  titolo: string
  messaggio?: string
  letta: boolean
  canale: NotificationChannel
  schedulataPer?: string
  entitaTipo?: NotificationEntityType
  entitaId?: string
  metadata?: AppNotificationMetadata
  createdAt: string
}

export type AttachmentMimeType = 'image/jpeg' | 'image/png' | 'application/pdf'

export interface AttachmentFileInput {
  uri: string
  name: string
  type: string
  size: number
}

export interface AttachmentValidationError {
  code: 'SIZE_LIMIT_EXCEEDED' | 'MIME_NOT_ALLOWED' | 'MIME_EXTENSION_MISMATCH' | 'FILE_NAME_INVALID'
  message: string
}

export interface AttachmentUploadResult {
  storagePath: string
  fileName: string
  mimeType: AttachmentMimeType
  sizeBytes: number
}

export interface Allegato {
  id: string
  transazioneId: string
  nomeFile: string
  storagePath: string
  mimeType?: AttachmentMimeType
  dimensioneBytes?: number
  descrizione?: string
  miniaturaPath?: string
  createdAt: string
}

export interface Category {
  id: string
  nome: string
  tipo: CategoryType
  predefinita: boolean
}

export type BudgetPeriod = 'mensile' | 'trimestrale' | 'annuale'

export interface Budget {
  id: string
  nome: string
  importoTarget: number
  periodo: BudgetPeriod
  categoriaId?: string
  contoId?: string
  dataInizio: string
  dataFine: string
  attivo: boolean
}

export interface SavingsGoal {
  id: string
  nome: string
  descrizione: string
  importoTarget: number
  importoCorrente: number
  dataInizio: string
  dataScadenza?: string
  contoAssociato?: string
  colore: string
  icona: string
  completato: boolean
  dataCompletamento?: string
}

export type AccountGroup = {
  id: string
  label: string
  accounts: Account[]
}

export type FullAccountGroup = AccountCategoryInfo & { accounts: Account[] }

export interface AppState {
  isAuthenticated: boolean
  isPrivateUnlocked: boolean
  accounts: Account[]
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  savingsGoals: SavingsGoal[]
  ricorrenze: Recurrence[]
  tags: Tag[]
  transactionTagMap: Record<string, string[]>
  notifications: AppNotification[]
  notificationsHydrated: boolean
  globalPinHash: string
  privatePinHash: string
}
