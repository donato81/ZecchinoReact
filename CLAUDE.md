# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZecchinoReact is a React Native personal finance app (Android, iOS, Windows) backed by Supabase. The entire domain — variable names, types, UI labels — is in Italian.

## Commands

```bash
npm start              # Start Metro bundler
npm run android        # Run on Android emulator/device
npm run ios            # Run on iOS simulator/device
npm run windows        # Run on Windows (react-native-windows)
npm run lint           # ESLint
npm test               # Jest (all platforms)
npm run test:windows   # Jest with Windows-specific config
```

Node >= 20 required. iOS requires `bundle exec pod install` after adding native deps.

## Environment Setup

Create a `.env` file (or `.env.local`) at the root with:

```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

These are injected via `react-native-dotenv` and read in `src/lib/supabase/client.ts`.

## Architecture

### Path Aliases

`@/*` maps to `src/*` (configured in `tsconfig.json` and Babel).

### Layer Structure

```
src/
  lib/
    types.ts                  # Client-side domain types (camelCase)
    constants.ts              # Account categories, labels, type→category maps
    helpers.ts                # Pure calculation utilities (balance, formatting, CSV)
    budget-forecasting.ts     # Spending projection logic with confidence levels
    budget-history.ts         # Historical budget period data
    supabase/
      client.ts               # Supabase singleton
      types.ts                # DB row types (snake_case) + RepositoryError + UserSettings
      cache.ts                # localStorage cache (24h TTL, keyed by userId+table)
      repositories/           # Data access layer
  context/
    AuthContext.tsx           # Auth, private PIN, inactivity timeout, session management
    UserSettingsContext.tsx   # Wraps use-user-settings hook
    VisibleDataContext.tsx    # Wraps use-visible-data hook
  hooks/
    use-user-settings.ts      # Raw hook: reads userSettings from AuthContext, writes to Supabase
    use-visible-data.ts       # Filters accounts/transactions by private-lock state
    use-display-preferences.ts # Thin wrapper delegating to useUserSettings
```

### Repository Pattern

Each file in `src/lib/supabase/repositories/` exposes `getAll`, `getById`, `create`, `update`, `remove` functions. They use internal `toClient()` / `toDb()` mappers to convert between snake_case DB rows (`DbAccount`, `DbTransaction`, etc.) and camelCase client types (`Account`, `Transaction`, etc.).

**The `Db*` types in `src/lib/supabase/types.ts` are internal to the `src/lib/supabase/` directory — do not import them from outside that directory.**

All DB errors are wrapped in `RepositoryError` (from `src/lib/supabase/types.ts`).

### Context / Hook Hierarchy

```
AuthContext          → holds session, user, userSettings (raw from Supabase)
  └── UserSettingsContext → derives display/SR/audio preferences from userSettings
        └── VisibleDataContext → filters visible accounts/transactions based on isPrivateUnlocked
```

Consumer components use:
- `useAuth()` for session and private-PIN operations
- `useUserSettings()` for display and accessibility preferences
- `useVisibleData()` for already-filtered account and transaction data

### Private Accounts

Accounts with `isPrivato: true` are hidden from `visibleAccounts` unless `isPrivateUnlocked` is `true` in `AuthContext`. The private PIN hash is stored in Supabase (`impostazioni_utente.pin_privato_hash`).

### Settings Write Pattern

Settings writes are **not optimistic** — local state is updated only after successful repository confirmation. All setters in `use-user-settings.ts` follow: call `updatePreference()`, then update local state; errors are surfaced via `settingsError`.

### Caching

`src/lib/supabase/cache.ts` provides a localStorage cache (24h TTL) keyed by `userId + table`. Call `invalidateCache(userId)` on sign-out. The cache is checked in repository reads before hitting Supabase.

## Database

SQL migration scripts are in `docs/6-sql/`. The main table is `impostazioni_utente`, which stores user settings and the `preferences` JSONB column containing all display, screen reader, and audio preferences. Row Level Security is enforced: `auth.uid() = user_id` on all operations.

## Key Types

| Type | File | Notes |
|------|------|-------|
| `Account`, `Transaction`, `Category`, `Budget`, `SavingsGoal` | `src/lib/types.ts` | Client domain types |
| `UserSettings`, `UserPreferences` | `src/lib/supabase/types.ts` | Preference shape (32 keys) |
| `AccountCategory` | `src/lib/constants.ts` | `banking \| digital \| savings \| investments \| private` |
| `TransactionType` | `src/lib/types.ts` | `entrata \| uscita \| trasferimento` |
