import { sdk } from './sdk'

/**
 * Whole-volume backup. `main` holds signal-cli's registration keys, contacts,
 * and message database — losing it means re-linking the service as a new
 * device. `startos` holds the API keys and `public` the key dependents read;
 * restoring `main` alone would bring back a Signal identity nothing can reach.
 */
export const { createBackup, restoreInit } = sdk.setupBackups([
  'main',
  'startos',
  'public',
])
