import { readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { sdk } from '../sdk'
import { i18n } from '../i18n'

/**
 * Empty the `main` volume: signal-cli's identity, contacts, and messages.
 *
 * Wipes the filesystem directly rather than calling the image's
 * `DELETE /v1/devices/{number}/local-data`. That endpoint needs the service
 * running and signal-cli refuses it while the account is still registered
 * (`--ignore-registered`), neither of which suits a stopped-only reset. It also
 * means upstream's ordering advice — unlink the device before deleting local
 * data — does not apply: removing a linked device is a primary-device action
 * that needs no cooperation from this one, so either order works.
 *
 * `store.json` is untouched by construction: it lives on the mountless
 * `startos` volume, so API keys and settings survive with no carve-out here.
 *
 * Only the volume's *contents* go; the root itself is the mountpoint and must
 * survive. `main.ts` recreates the config dir and claims it for uid 1000 on the
 * next start, so a wiped volume and a fresh install reach the same state.
 */
export const resetData = sdk.Action.withoutInput(
  'reset-data',
  async () => ({
    name: i18n('Delete All Accounts and Data'),
    description: i18n(
      "Permanently delete this server's Signal identity, contacts, and message history. The service is left with no accounts and must be linked again before it can send or receive. API keys and settings are preserved.",
    ),
    warning: i18n(
      'This cannot be undone. Without a StartOS backup the identity is gone for good — linking again creates a new one, and your contacts will see a changed safety number.',
    ),
    // Stopped-only: the daemon holds signal-cli's database open, and deleting
    // it underneath a running process is how you get a half-wiped volume.
    allowedStatuses: 'only-stopped',
    group: i18n('Danger Zone'),
    visibility: 'enabled',
  }),
  async () => {
    const root = sdk.volumes.main.path
    const entries = await readdir(root)

    if (entries.length === 0) {
      return {
        version: '1',
        title: i18n('Nothing to Delete'),
        message: i18n('This service holds no Signal data.'),
        result: null,
      }
    }

    for (const entry of entries) {
      await rm(join(root, entry), { recursive: true, force: true })
    }

    return {
      version: '1',
      title: i18n('Signal Data Deleted'),
      message: i18n(
        'Run Link Signal Account to join an account again. Note that this service may still be listed under Settings → Linked devices in Signal — deleting its data here does not remove it there, so remove it on your phone to free the device slot.',
      ),
      result: null,
    }
  },
)
