import { T } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { i18n } from '../i18n'
import { listAccounts, listIdentities, trustIdentity } from '../signal-client'

const { InputSpec, Value, Variants } = sdk

/**
 * Mark a contact's key trusted.
 *
 * Needed on the *default* trust setting, not only on `never`. `on-first-use` is
 * trust-on-first-use: the first key seen for a contact is accepted silently,
 * but a key that later *changes* is not — it goes UNTRUSTED and sends to that
 * contact fail (signal-cli exit code 4, "Sending failed due to untrusted key").
 * A contact reinstalling Signal or switching phones is the ordinary trigger.
 *
 * `never` additionally blocks the first key, so that setting is unusable
 * without this action — but it is not the only reason this action exists.
 *
 * The API takes exactly one of a verified safety number or `trust_all_known_keys`
 * and rejects a request carrying both or neither, so the input is a union.
 */

/**
 * `account` and `contact` packed into one select value.
 *
 * A single dropdown rather than an account picker plus a contact picker,
 * because a `dynamicSelect` sees only `effects` and the saved prefill — it
 * cannot read a sibling field — so a contact list could not narrow itself to
 * whichever account was chosen. Listing every account's identities at once
 * sidesteps that, and reads better in the expected single-account setup.
 *
 * `|` appears in neither an E.164 number (`+` and digits) nor a UUID (hex and
 * dashes), so the split is unambiguous — and unlike a NUL it leaves the file
 * plain text, which grep and diff both care about.
 */
const SEP = '|'

function packIdentity(account: string, contact: string): string {
  return `${account}${SEP}${contact}`
}

function unpackIdentity(value: string): { account: string; contact: string } {
  const [account = '', contact = ''] = value.split(SEP)
  return { account, contact }
}

/** Sentinel option shown when there is nothing to trust yet. */
const NONE = ''

const inputSpec = InputSpec.of({
  identity: Value.dynamicSelect(async ({ effects }) => {
    const values: Record<string, string> = {}

    // An identity list that fails shouldn't render a broken form. Fall through
    // to the empty state; the handler explains it.
    try {
      const accounts = await listAccounts(effects)
      const multiple = accounts.length > 1

      for (const account of accounts) {
        const identities = await listIdentities(effects, account)
        for (const identity of identities) {
          // A contact known only by UUID has no number; trust accepts either.
          const contact = identity.number || identity.uuid
          if (!contact) continue
          const label = `${contact} · ${identity.status}`
          values[packIdentity(account, contact)] = multiple
            ? `${label} (${account})`
            : label
        }
      }
    } catch {
      // Leave `values` empty.
    }

    if (Object.keys(values).length === 0) {
      values[NONE] = i18n(
        'No identities yet — exchange a message with a contact first',
      )
    }

    return {
      name: i18n('Identity to Trust'),
      description: i18n(
        'A contact signal-cli knows, and how far it is trusted today. Contacts appear here once you have exchanged a message. An UNTRUSTED key blocks messaging with that contact until it is trusted.',
      ),
      default: Object.keys(values)[0]!,
      values,
      disabled: false,
    }
  }),
  how: Value.union({
    name: i18n('How to Trust'),
    description: null,
    warning: null,
    default: 'safety-number',
    variants: Variants.of({
      'safety-number': {
        name: i18n('Verified safety number'),
        spec: InputSpec.of({
          safetyNumber: Value.text({
            name: i18n('Safety Number'),
            description: i18n(
              "The contact's safety number can be found in the Signal app on your phone.",
            ),
            required: true,
            default: null,
            placeholder: '12345 67890 12345 67890 …',
          }),
        }),
      },
      'all-known-keys': {
        name: i18n('Trust all known keys — no verification'),
        spec: InputSpec.of({}),
      },
    }),
  }),
})

export const trustIdentityAction = sdk.Action.withInput(
  'trust-identity',
  async () => ({
    name: i18n('Trust Identity'),
    description: i18n(
      "Mark a contact's encryption key as trusted. Needed when Trust New Identities is set to never, or after a contact reinstalls Signal and their key changes.",
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('General'),
    visibility: 'enabled',
  }),
  inputSpec,
  async () => null,
  async ({ effects, input }) => {
    if (input.identity === NONE) {
      return {
        version: '1',
        title: i18n('Nothing to Trust'),
        message: i18n(
          'This service knows no contact identities yet. One appears after you exchange a message with a contact.',
        ),
        result: null,
      }
    }

    const { account, contact } = unpackIdentity(input.identity)

    const how: Parameters<typeof trustIdentity>[3] =
      input.how.selection === 'safety-number'
        ? { verifiedSafetyNumber: input.how.value.safetyNumber.trim() }
        : { allKnownKeys: true }

    try {
      await trustIdentity(effects, account, contact, how)
    } catch (err) {
      return {
        version: '1',
        title: i18n('Could Not Trust This Identity'),
        message: (err as Error).message,
        result: null,
      }
    }

    return {
      version: '1',
      title: i18n('Identity Trusted'),
      message:
        input.how.selection === 'safety-number'
          ? i18n(
              'Signal accepted the safety number, so this key is the one your contact is holding. Messaging with them works again.',
            )
          : i18n(
              'Trusted without verification. Run List Signal Accounts to confirm the new status.',
            ),
      result: {
        type: 'single',
        name: i18n('Contact'),
        description: null,
        value: contact,
        copyable: true,
        qr: false,
        masked: false,
      } satisfies T.ActionResultMember,
    }
  },
)
