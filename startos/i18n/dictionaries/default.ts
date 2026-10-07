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
  // action groups
  General: 5,
  'Danger Zone': 101,

  // api-keys action
  // 6-8 and 12-14 retired with the old API Keys action.
  Label: 9,
  'Identifies this key in Revoke API Key. Name it after the client that will use it; each label must be unique.': 10,
  Token: 11,

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
  'Selected kinds are not downloaded as messages arrive, which saves disk and bandwidth.\n- Attachments: files sent with received messages are not downloaded, so whatever consumes this API can never retrieve them\n- Stories: story messages are not received from Signal\n- Avatars: profile pictures from received messages are not downloaded\n- Stickers: sticker packs from received messages are not downloaded': 48,
  Attachments: 49,
  Stories: 50,
  Avatars: 51,
  Stickers: 52,
  'Trust New Identities': 53,
  "What happens when a contact presents a key this service has not seen.\n- On first use: a new contact's first key is trusted; a changed key blocks messaging with that contact until you run Trust Identity\n- Always: every new or changed key is trusted without verification, which hides the sign of an intercepted conversation\n- Never: every key, a new contact's first included, blocks messaging with that contact until you run Trust Identity": 54,
  'On first use (recommended)': 55,
  Always: 56,
  'Never — trust each contact by hand': 57,
  'Default Text Mode': 58,
  'Applies when a client sends a message without choosing a text mode.\n- Normal: the text is sent exactly as written\n- Styled: formatting markers in the text become Signal formatting such as bold and italics': 59,
  Normal: 60,
  Styled: 61,
  'Log Level': 62,
  'How much the container writes to the service log.\n- Debug: for diagnosing a problem; verbose, and can include message metadata\n- Info: normal operation\n- Warn: warnings and errors only\n- Error: errors only': 63,
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

  // 109 retired with the internal signal-cli readiness stub.

  // API key actions
  'Create API Key': 110,
  'Generate a bearer token for an outside client of the Signal API.': 111,
  'An API key with this label already exists.': 112,
  'API Key Created': 113,
  'Copy this token now. It will not be shown again.': 114,
  'Revoke API Key': 115,
  'Stop an outside client from using the Signal API.': 116,
  'No API keys to revoke': 117,
  'API Key': 118,
  'Keys are listed by label. The client using the selected key loses access immediately; create its replacement first when rotating credentials.': 119,
  'Nothing to Revoke': 120,
  'This service has no API keys.': 121,
  'The selected API key no longer exists.': 122,
  'API Key Revoked': 123,
  'The selected key no longer grants access.': 124,

  // action API errors
  'Could not reach the Signal API': 125,
  'Signal API returned an error': 126,
  'Signal API returned a non-JSON response': 127,
  'The Signal API returned no device link.': 128,
  'The label must contain a visible character.': 129,
  '- Verified safety number: signal-cli trusts the key only if the number you enter matches it, so a mistyped or stale number is rejected\n- Trust all known keys — no verification: trusts every key signal-cli holds for this contact without checking it': 130,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
