import { T } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { i18n } from '../i18n'
import {
  Identity,
  LinkedDevice,
  listAccounts,
  listDevices,
  listIdentities,
} from '../signal-client'

/**
 * Show the Signal accounts this service is linked to, and the devices linked to
 * each of them — the "did the link work?" action, and where an operator finds
 * the number a consuming service needs.
 *
 * Accounts and devices are one action rather than two because `/v1/devices`
 * takes an account number: a standalone device list would have to enumerate
 * accounts anyway, or make the operator paste a number in from elsewhere.
 *
 * `/v1/accounts` returns a bare array and the image supports more than one
 * account, so this renders whatever is there rather than asserting a count.
 */

// Mirrors how setupI18n derives its locale, so dates render in the same
// language as the surrounding labels.
const LOCALE =
  process.env.LANG?.replace(/\.UTF-8$/, '').replace('_', '-') || 'en-US'

/**
 * A device timestamp as a locale-formatted date, in UTC.
 *
 * Date only, and UTC, because Signal truncates `last_seen_timestamp` to a day
 * boundary — every value arrives at exactly 00:00 UTC, so any clock time shown
 * would be invented, and rendering it in another zone would shift the date.
 * Creation stamps are millisecond-precise but shown the same way, since a pair
 * of dates in two different formats reads as a bug.
 */
function formatDate(ms: number): string {
  if (!ms) return '—'
  return new Intl.DateTimeFormat(LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(ms))
}

/**
 * An identity's trust level, as the operator needs to read it.
 *
 * signal-cli's raw levels are shouted constants; the safety number is what a
 * person actually compares, so it is the value and the level is the label.
 */
function identityMember(identity: Identity): T.ActionResultMember {
  return {
    type: 'single',
    name: identity.number || identity.uuid,
    description: identity.status,
    value: identity.safetyNumber || i18n('No safety number reported'),
    copyable: !!identity.safetyNumber,
    qr: false,
    masked: false,
  }
}

function deviceMember(device: LinkedDevice): T.ActionResultMember {
  return {
    type: 'single',
    // Device 1 is the primary and always reports an empty name.
    name: device.name || i18n('Primary device'),
    description: null,
    value: i18n('Device ${id} · linked ${created} · last seen ${lastSeen}', {
      id: device.id,
      created: formatDate(device.created),
      lastSeen: formatDate(device.lastSeen),
    }),
    copyable: false,
    qr: false,
    masked: false,
  }
}

export const listSignalAccountsAction = sdk.Action.withoutInput(
  'list-signal-accounts',
  async () => ({
    name: i18n('List Signal Accounts'),
    description: i18n('Show the Signal accounts this service is linked to.'),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('General'),
    visibility: 'enabled',
  }),
  async ({ effects }) => {
    let accounts: string[]
    try {
      accounts = await listAccounts(effects)
    } catch (err) {
      return {
        version: '1',
        title: i18n('Could Not Read Accounts'),
        message: (err as Error).message,
        result: null,
      }
    }

    // No accounts is the ordinary pre-link state, not a failure — say what to
    // do about it rather than showing an empty list.
    if (accounts.length === 0) {
      return {
        version: '1',
        title: i18n('Not Linked Yet'),
        message: i18n(
          'This service is not linked to a Signal account. Run the Link Signal Account action, then scan the code from Signal → Settings → Linked devices.',
        ),
        result: null,
      }
    }

    const members: T.ActionResultMember[] = []
    for (const account of accounts) {
      const entries: T.ActionResultMember[] = [
        {
          type: 'single',
          name: i18n('Phone Number'),
          description: null,
          value: account,
          copyable: true,
          qr: false,
          masked: false,
        },
      ]

      // A device list that fails shouldn't cost the account list. Degrade to a
      // note against that account and carry on.
      try {
        const devices = await listDevices(effects, account)
        entries.push({
          type: 'group',
          name: i18n('Linked Devices'),
          description: i18n(
            'Devices linked to this account, with when each was linked and when Signal last saw it. Signal reports last-seen as a date only.',
          ),
          value: devices.map(deviceMember),
        })
      } catch {
        entries.push({
          type: 'single',
          name: i18n('Linked Devices'),
          description: null,
          value: i18n('Could not read the linked devices for this account.'),
          copyable: false,
          qr: false,
          masked: false,
        })
      }

      // Identities live here rather than in their own action for the same
      // reason devices do: /v1/identities takes an account number, so a
      // standalone list would make the operator paste one in from here anyway.
      try {
        const identities = await listIdentities(effects, account)
        entries.push({
          type: 'group',
          name: i18n('Contact Identities'),
          description: i18n(
            'Contacts this service has exchanged messages with, and how far each key is trusted. An UNTRUSTED entry blocks messaging with that contact — clear it with the Trust Identity action. A key that changes goes UNTRUSTED even on the default trust setting.',
          ),
          value: identities.length
            ? identities.map(identityMember)
            : [
                {
                  type: 'single',
                  name: i18n('None yet'),
                  description: null,
                  value: i18n(
                    'An identity appears once you exchange a message with a contact.',
                  ),
                  copyable: false,
                  qr: false,
                  masked: false,
                },
              ],
        })
      } catch {
        entries.push({
          type: 'single',
          name: i18n('Contact Identities'),
          description: null,
          value: i18n(
            'Could not read the contact identities for this account.',
          ),
          copyable: false,
          qr: false,
          masked: false,
        })
      }

      members.push({
        type: 'group',
        name: account,
        description: null,
        value: entries,
      })
    }

    return {
      version: '1',
      title: i18n('Linked Accounts'),
      message: i18n(
        'The Signal accounts this service can send and receive as.',
      ),
      result: {
        type: 'group',
        name: i18n('Linked Accounts'),
        description: null,
        value: members,
      },
    }
  },
)
