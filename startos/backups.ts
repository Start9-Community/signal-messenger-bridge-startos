import { sdk } from './sdk'

/**
 * Whole-volume backup of both volumes. `main` holds signal-cli's registration
 * keys, contacts, and message database — losing it means re-linking the service
 * as a new device — and `startos` holds the API keys. Restoring `main` alone
 * would bring back a working Signal identity whose proxy tokens are gone.
 */
export const { createBackup, restoreInit } = sdk.setupBackups([
  'main',
  'startos',
])
