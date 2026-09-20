# Signal Messenger Bridge

This service has no human chat interface — it is driven entirely by your own software over a REST and WebSocket API. For chatting by hand, use the Signal mobile or desktop apps.

## Documentation

- [signal-cli-rest-api API reference](https://bbernhard.github.io/signal-cli-rest-api/) — every endpoint, with request and response shapes.
- [REST examples](https://github.com/bbernhard/signal-cli-rest-api/blob/master/doc/EXAMPLES.md) — copy-pasteable `curl` for the common calls.
- [signal-cli](https://github.com/AsamK/signal-cli) — the client underneath, and the authority on trust and identity behavior.
- [Signal](https://signal.org) — about the network this connects to.

## What you get on StartOS

- A **REST API** for sending messages, attachments, reactions, and receipts, and for managing groups and contacts.
- A **realtime receive stream** over WebSocket at `/v1/receive/{account}`, so your software sees messages as they arrive rather than polling.
- Both gated by an **API key** for anything outside this server, and reachable without one by services running on the same box.
- **Actions** to link the account, inspect it, trust changed contact keys, manage API keys, and start over.

## Choosing an account

This service joins Signal as a **secondary device** on an account that already exists — the same way Signal Desktop does. It never registers a phone number of its own, so the first decision is whose account it links to. Both options are supported and neither is more "correct":

- **Link your personal account.** Your software then sends and receives as you, from your number, in your existing conversations. Contacts see messages from you. Convenient for a personal assistant; it also means anything with API access can speak in your name.
- **Link a separate account.** Register a spare phone number as an ordinary Signal account on a phone, then link this service to that. The bot gets its own identity, its own number, and its own conversations, and your personal account is untouched.

A dedicated identity needs a second number that can receive an SMS, and the registration itself happens on a phone — this service does not register numbers, because Signal requires a captcha that cannot be solved from the StartOS interface.

## Getting set up

1. Start the service.
2. Run **Link Signal Account**. Give it a device name (it appears in Signal under Settings → Linked devices) and it returns a QR code and a link.
3. On the phone holding the account, open Signal → Settings → Linked devices → Link new device, and scan the code.
4. Run **List Signal Accounts** to confirm. The phone number it reports is what your software passes to the API.
5. Run **API Keys** to copy the key created on install, or add your own.
6. Open **Interfaces → API** and copy the URL StartOS publishes for your network.

The link is single-use and expires quickly, and Signal issues a different one on every request — run the action again for a fresh one. Treat it as a credential while it is live: anyone who scans it becomes a linked device on the account, able to read and send.

On-box StartOS services that depend on this package connect directly and do not need an API key.

## Authentication

Outside access is gated by a bearer token at the StartOS reverse proxy. Send `Authorization: Bearer <token>` on every request, including the WebSocket upgrade — anything without a valid token gets `401` and never reaches the service.

Manage tokens in **API Keys**: each has a label to identify the client and a generated token. Add one per client; delete one to revoke its access. Deleting every key locks out all outside access, which is a supported way to close the service off — nothing re-creates a key behind your back.

The upstream software ships no authentication of its own, so this gate is the only thing between the network and full control of the linked account.

## Using the API

Send a message:

```bash
curl -X POST 'https://<your-address>/v2/send' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"number": "+15551234567", "recipients": ["+15559876543"], "message": "Hello"}'
```

Receive in realtime, over a WebSocket:

```
wss://<your-address>/v1/receive/+15551234567
```

Attachments cross the API rather than a shared folder: outbound as base64 in the send payload, inbound fetched from `/v1/attachments/{id}`. Nothing needs access to this service's files.

## Settings

**Signal Settings** holds the service's advanced options. The defaults suit most installs, and every one of them takes effect at startup, so saving a change restarts the service — the action tells you whether it did.

- **Do Not Download** — skip fetching attachments, stories, avatars, or stickers as messages arrive, to save disk and bandwidth. Skipping attachments means they cannot be retrieved later; there is nothing stored to serve.
- **Trust New Identities** — see below.
- **Default Text Mode** — whether message text is plain or uses Signal formatting, when the sender does not specify.
- **Log Level** — how much the service writes to its log. Debug is for diagnosing a problem and is verbose.

## Trusting contacts

Signal identifies each contact by an encryption key. On the default setting, **On first use (recommended)**, the first key seen for a contact is accepted silently — but if that key later *changes*, it is not. Messages to that contact stop going through until you trust the new key.

A key changing is normal and usually innocent: your contact reinstalled Signal, got a new phone, or re-registered. It is also exactly what an intercepted conversation would look like, which is why Signal does not accept it quietly.

To clear it, run **Trust Identity**, pick the contact, and enter the safety number you compared with them in the Signal app. Signal rejects a number that does not match the key it holds, so a wrong entry fails loudly rather than trusting the wrong key. The action also offers to trust without verification, for when comparing is impractical — that skips the check entirely.

**List Signal Accounts** shows every contact identity and its current trust status, so you can see what is blocked.

The other two settings change when this applies. **Always** accepts changed keys silently, so nothing ever blocks and you are never told a key changed. **Never — trust each contact by hand** trusts nothing automatically, so every contact must be trusted by hand before you can message them at all.

## Starting over

To abandon the current account, run **Delete All Accounts and Data** under Danger Zone, with the service stopped. It permanently deletes the Signal identity, contacts, and message history on this server. Your API keys and settings are preserved.

Without a StartOS backup this cannot be undone — linking again creates a new identity, and your contacts will see a changed safety number.

Deleting the data here does not remove this device from the account. It stays listed under Settings → Linked devices in the Signal app until you remove it there, so do that too if you are done with it. Either order works.
