# Signal Messenger Bridge

This service has no human chat interface. Your own software drives it through a REST and WebSocket API; use Signal's mobile or desktop apps for ordinary conversation.

## Documentation

- [signal-cli-rest-api documentation](https://github.com/bbernhard/signal-cli-rest-api) — the upstream API reference, examples, and configuration guide.
- [signal-cli README](https://github.com/AsamK/signal-cli/blob/master/README.md) — the underlying Signal client and its account model.

## What you get on StartOS

- A REST API for sending messages, attachments, reactions, and receipts and for managing groups and contacts.
- A realtime WebSocket receive stream at `/v1/receive/{account}`.
- Bearer-token access for clients connecting through the API interface.
- Actions for linking an account, managing client access, changing advanced settings, trusting changed contact keys, and inspecting the running service.

Services on the same StartOS server connect through the package dependency and do not need an API key.

## Choosing an account

The service joins an existing Signal account as a secondary device, like Signal Desktop. Choose one of these approaches before linking:

- Link your personal account when your software should send and receive as you. Anything with API access can then speak in your name.
- Register a spare number in Signal on a phone, then link that account when your bot should have a separate identity and conversations.

This service does not register numbers. Signal registration requires a captcha outside the StartOS interface.

## Getting set up

1. Start the service.
2. Run **Link Signal Account**, choose the device name that should appear in Signal, and leave the result open.
3. On the phone holding the account, open Signal → Settings → Linked devices → Link new device, then scan the QR code.
4. Run **List Signal Accounts** to confirm the link and copy the account number your client will use.
5. If the client connects through the **API** interface, run **Create API Key** and copy the returned token. The token is shown only when created.
6. Give the client the API interface address and send the token as `Authorization: Bearer <token>` on every request, including WebSocket upgrades.

The device link is single-use and expires quickly. Run **Link Signal Account** again for a fresh one, and treat every unredeemed link as a credential.

## Using the API

Send a message:

```bash
curl -X POST 'https://<your-address>/v2/send' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"number": "+15551234567", "recipients": ["+15559876543"], "message": "Hello"}'
```

Receive messages over a WebSocket:

```text
wss://<your-address>/v1/receive/+15551234567
```

Attachments cross the API rather than a shared folder: include outbound files as base64 in the send payload and fetch inbound files from `/v1/attachments/{id}`.

## Actions

- **Create API Key** generates access for one outside client. Copy the token immediately; it is not shown again.
- **Revoke API Key** immediately removes a client's access. Create a replacement first when rotating credentials without downtime.
- **Link Signal Account** produces a short-lived QR code for adding this service as a secondary device.
- **List Signal Accounts** shows linked numbers, devices, and contact trust states.
- **Signal Settings** controls skipped media downloads, trust policy, default text formatting, and log verbosity. Saving a real change restarts the service when needed.
- **Trust Identity** accepts a contact's changed key. Prefer entering a safety number you compared with the contact; trusting all known keys skips that verification.
- **Version Info** reports the running API mode and capabilities for compatibility checks.
- **Delete All Accounts and Data** permanently removes the local Signal identity, contacts, attachments, and messages. Stop the service first. API keys and settings remain.

## Trusting contacts

Signal identifies each contact by an encryption key. The default policy accepts the first key seen, but blocks messaging when that key later changes. A reinstall or new phone commonly causes a legitimate change; interception can look the same.

Run **Trust Identity**, choose the contact, and enter the safety number you compared in Signal. A mismatched number is rejected. The unverified option restores messaging without that comparison.

**List Signal Accounts** shows current contact trust states. The **Always** policy silently accepts changes; **Never — trust each contact by hand** requires this action for every new contact.

## Starting over

To abandon the local Signal identity:

1. Make a backup if you may need the identity or message data again.
2. Stop the service and run **Delete All Accounts and Data**.
3. Remove this device under Settings → Linked devices in the primary Signal app.
4. Start the service and run **Link Signal Account** when you are ready to link again.

Deleting local data does not remove the secondary device from Signal's linked-device list. Without a backup, linking again creates a new local identity and contacts will see a changed safety number.

## Limitations

- Account registration is unavailable; link an account already registered on a phone.
- Unlinking is performed from the primary Signal app.
- Deleting the Signal account itself is intentionally unavailable because it is irreversible.
