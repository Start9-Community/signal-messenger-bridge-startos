import { sdk } from '../sdk'
import { apiKeys } from './api-keys'
import { linkSignalAccount } from './link-signal-account'
import { listSignalAccountsAction } from './list-signal-accounts'
import { signalSettingsAction } from './signal-settings'
import { trustIdentityAction } from './trust-identity'
import { versionInfo } from './version-info'
import { resetData } from './reset-data'

export const actions = sdk.Actions.of()
  .addAction(apiKeys)
  .addAction(linkSignalAccount)
  .addAction(listSignalAccountsAction)
  .addAction(signalSettingsAction)
  .addAction(trustIdentityAction)
  .addAction(versionInfo)
  .addAction(resetData)
