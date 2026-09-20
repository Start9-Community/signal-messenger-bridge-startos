export const DEFAULT_LANG = 'en_US'

/**
 * English source string -> stable integer key.
 *
 * The integers are the join key into every file in ../translations.ts, so they
 * are append-only: never renumber, and leave a hole behind when a key retires.
 */
const dict = {
  // main.ts / interfaces.ts / health
  'Starting Signal Messenger Bridge!': 0,
  API: 1,
  'Token-authenticated REST and WebSocket API for sending and receiving Signal messages': 2,
  'Signal API is ready': 3,
  'Signal API is not ready': 4,
  // the signal-cli daemon's ready stub — display: null, so log-only
  'Not observable from outside the container': 109,

  // action groups
  General: 5,
  'Danger Zone': 101,

  // api-keys action
  'API Keys': 6,
  'Manage the bearer tokens that gate outside access to the Signal API.': 7,
  'Bearer tokens that grant outside access to the Signal API. Add one per client; delete to revoke. On-box services connect directly and never need a key.': 8,
  Label: 9,
  'A name to identify this key (e.g. the client it belongs to).': 10,
  Token: 11,
  'Leave blank when adding a key and one is generated for you. Keep it secret.': 12,
  'API Keys Saved': 13,
  'Outside clients authenticate with the header: Authorization: Bearer <token>': 14,

  // link-signal-account action
  // 15 retired: the action was renamed from "Link Device". Replaced by 98.
  'Link Signal Account': 98,
  'Device Link': 100,
  'Link this service to an existing Signal account as a secondary device.': 16,
  'Device Name': 17,
  'The name this service appears under in Signal → Settings → Linked devices.': 18,
  'Scan this from Signal → Settings → Linked devices → Link new device. It works once and expires shortly — run this action again for a fresh one. Anyone who scans it can read and send as this account, so do not share it.': 20,
  'Could Not Create a Device Link': 21,

  // list-signal-accounts action
  'List Signal Accounts': 22,
  'Show the Signal accounts this service is linked to.': 23,
  'Linked Accounts': 24,
  'The Signal accounts this service can send and receive as.': 25,
  'Not Linked Yet': 26,
  // 27 retired alongside 15: it named the action. Replaced by 99.
  'This service is not linked to a Signal account. Run the Link Signal Account action, then scan the code from Signal → Settings → Linked devices.': 99,
  'Could Not Read Accounts': 28,
  'Phone Number': 29,
  'Linked Devices': 30,
  'Devices linked to this account, with when each was linked and when Signal last saw it. Signal reports last-seen as a date only.': 31,
  'Primary device': 32,
  'Could not read the linked devices for this account.': 33,

  // version-info action
  'Version Info': 34,
  'Show the signal-cli version and the API mode this service is running.': 35,
  Version: 36,
  Mode: 37,
  'The realtime receive stream requires json-rpc mode.': 38,
  Build: 39,
  'Supported API Versions': 40,
  'Could Not Read Version Info': 41,
  'API Capabilities': 42,
  'Optional features the API reports per endpoint. Re-check these after a version bump — a missing one breaks whatever relied on it.': 43,
  'Device ${id} · linked ${created} · last seen ${lastSeen}': 44,

  // signal-settings action
  'Signal Settings': 45,
  'Advanced service settings.': 46,
  'Do Not Download': 47,
  'Media signal-cli fetches automatically as messages arrive. Skip a kind to save disk and bandwidth. Skipping attachments means whatever consumes this API can never retrieve them — there is nothing stored to serve.': 48,
  Attachments: 49,
  Stories: 50,
  Avatars: 51,
  Stickers: 52,
  'Trust New Identities': 53,
  'What to do when a contact presents a key this service has not seen. On first use matches Signal itself. Always removes the warning that a key changed, which is the signal of an intercepted conversation. Never blocks messaging with that contact until you run Trust Identity.': 54,
  'On first use (recommended)': 55,
  Always: 56,
  'Never — trust each contact by hand': 57,
  'Default Text Mode': 58,
  'How message text is interpreted when the sender does not say. Styled enables Signal formatting such as bold and italics.': 59,
  Normal: 60,
  Styled: 61,
  'Log Level': 62,
  'How much the container writes to the service log. Debug is for diagnosing a problem; it is verbose and can include message metadata.': 63,
  Debug: 64,
  Info: 65,
  Warn: 66,
  Error: 67,
  'No Changes': 68,
  'These settings already match what the service is running.': 69,
  'Settings Saved': 70,
  'Restarting the service to apply the change.': 71,
  'The change takes effect the next time the service starts.': 72,

  // trust-identity action
  'Trust Identity': 73,
  "Mark a contact's encryption key as trusted. Needed when Trust New Identities is set to never, or after a contact reinstalls Signal and their key changes.": 74,
  'Identity to Trust': 75,
  // 76 retired: said UNTRUSTED only blocks under the `never` setting. It also
  // blocks a *changed* key under the default `on-first-use`. Replaced by 96.
  'A contact signal-cli knows, and how far it is trusted today. Contacts appear here once you have exchanged a message. An UNTRUSTED key blocks messaging with that contact until it is trusted.': 96,
  'No identities yet — exchange a message with a contact first': 77,
  'How to Trust': 78,
  'Verified safety number': 79,
  'Safety Number': 80,
  "The contact's safety number can be found in the Signal app on your phone.": 81,
  'Trust all known keys — no verification': 82,
  'Nothing to Trust': 83,
  'This service knows no contact identities yet. One appears after you exchange a message with a contact.': 84,
  'Could Not Trust This Identity': 85,
  'Identity Trusted': 86,
  'Signal accepted the safety number, so this key is the one your contact is holding. Messaging with them works again.': 87,
  'Trusted without verification. Run List Signal Accounts to confirm the new status.': 88,
  Contact: 89,

  // list-signal-accounts: identities
  'Contact Identities': 90,
  // 91 retired for the same reason as 76. Replaced by 97.
  'Contacts this service has exchanged messages with, and how far each key is trusted. An UNTRUSTED entry blocks messaging with that contact — clear it with the Trust Identity action. A key that changes goes UNTRUSTED even on the default trust setting.': 97,
  'No safety number reported': 92,
  'None yet': 93,
  'An identity appears once you exchange a message with a contact.': 94,
  'Could not read the contact identities for this account.': 95,

  // reset-data action
  'Delete All Accounts and Data': 102,
  "Permanently delete this server's Signal identity, contacts, and message history. The service is left with no accounts and must be linked again before it can send or receive. API keys and settings are preserved.": 103,
  'This cannot be undone. Without a StartOS backup the identity is gone for good — linking again creates a new one, and your contacts will see a changed safety number.': 104,
  'Nothing to Delete': 105,
  'This service holds no Signal data.': 106,
  'Signal Data Deleted': 107,
  'Run Link Signal Account to join an account again. Note that this service may still be listed under Settings → Linked devices in Signal — deleting its data here does not remove it there, so remove it on your phone to free the device slot.': 108,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
