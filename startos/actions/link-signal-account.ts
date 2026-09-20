import { sdk } from '../sdk'
import { i18n } from '../i18n'
import { deviceLinkUri } from '../signal-client'

const { InputSpec, Value } = sdk

/**
 * Link the service to an existing Signal account as a secondary device.
 *
 * This is the whole account-setup story: the service does not register a number
 * of its own, it joins one that already exists — so it needs no captcha and no
 * SMS. Point it at your personal account and the agent sends as you; point it
 * at a spare number registered on another handset and the agent has its own
 * identity. Both are supported, and the choice is the user's.
 *
 * Signal issues a different link per request and each is single-use, so there
 * is nothing to cache and no reason to reuse one.
 */
export const linkSignalAccount = sdk.Action.withInput(
  'link-signal-account',
  async () => ({
    name: i18n('Link Signal Account'),
    description: i18n(
      'Link this service to an existing Signal account as a secondary device.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('General'),
    visibility: 'enabled',
  }),
  InputSpec.of({
    deviceName: Value.text({
      name: i18n('Device Name'),
      description: i18n(
        'The name this service appears under in Signal → Settings → Linked devices.',
      ),
      required: true,
      default: 'StartOS',
      masked: false,
      placeholder: 'StartOS',
      minLength: 1,
      maxLength: 64,
      patterns: [],
      inputmode: 'text',
    }),
  }),
  async () => ({ deviceName: 'StartOS' }),
  async ({ effects, input }) => {
    let uri: string
    try {
      uri = await deviceLinkUri(effects, input.deviceName.trim() || 'StartOS')
    } catch (err) {
      return {
        version: '1',
        title: i18n('Could Not Create a Device Link'),
        message: (err as Error).message,
        result: null,
      }
    }

    return {
      version: '1',
      title: i18n('Link Signal Account'),
      message: i18n(
        'Scan this from Signal → Settings → Linked devices → Link new device. It works once and expires shortly — run this action again for a fresh one. Anyone who scans it can read and send as this account, so do not share it.',
      ),
      result: {
        type: 'single',
        name: i18n('Device Link'),
        description: null,
        value: uri,
        copyable: true,
        qr: true,
        // The URI grants device access to the account, so keep it hidden until
        // the operator chooses to reveal it.
        masked: true,
      },
    }
  },
)
