import { sdk } from '../sdk'
import { createApiKey } from './create-api-key'
import { linkSignalAccount } from './link-signal-account'
import { listSignalAccountsAction } from './list-signal-accounts'
import { signalSettingsAction } from './signal-settings'
import { trustIdentityAction } from './trust-identity'
import { versionInfo } from './version-info'
import { resetData } from './reset-data'
import { revokeApiKey } from './revoke-api-key'

export const actions = sdk.Actions.of()
  .addAction(createApiKey)
  .addAction(linkSignalAccount)
  .addAction(listSignalAccountsAction)
  .addAction(revokeApiKey)
  .addAction(signalSettingsAction)
  .addAction(trustIdentityAction)
  .addAction(versionInfo)
  .addAction(resetData)
