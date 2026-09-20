<p align="center">
  <img src="icon.svg" alt="Signal Messenger Bridge Logo" width="21%">
</p>

# Signal Messenger Bridge on StartOS

> Everything not listed in this document should behave the same as upstream
> Signal Messenger Bridge. If a feature, setting, or behavior is not mentioned
> here, the upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

This package runs `signal-cli-rest-api`, which wraps `signal-cli`, as a headless Signal client. It gives software a REST and WebSocket API for sending and receiving Signal messages; it is not a human chat interface.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

The package uses the unmodified `bbernhard/signal-cli-rest-api` image on x86_64 and aarch64. The `signal-cli-sub` subcontainer runs the image's s6 entrypoint as its init process, preserving upstream supervision of both the REST server and the resident `signal-cli` JSON-RPC daemon.

`MODE=json-rpc` is fixed because the realtime receive stream depends on a resident daemon. The package also fixes the API port and Signal configuration path, then passes the remaining operator-controlled settings as environment variables.

The image runs as uid/gid 1000. A root oneshot creates `/data/signal-cli` and repairs its ownership before the image starts; the volume root remains root-owned.

## Volume and Data Layout

The service separates upstream Signal state from StartOS-owned configuration and credentials.

| Volume | Mount point | Contents |
| --- | --- | --- |
| `main` | `/data` | Signal identity keys, contacts, identities, attachments, and message data under `/data/signal-cli` |
| `startos` | Not mounted | `store.json`, including API-key records and launch settings |

Keeping `startos` mountless prevents the upstream application from reading the bearer tokens enforced by the StartOS proxy.

## File Models

The package owns one JSON file model, `store.json`, on the mountless `startos` volume. It stores bearer-token records and the settings that are translated into container environment variables.

The **Create API Key**, **Revoke API Key**, and **Signal Settings** actions are the only normal writers. API-key changes are watched by `setupInterfaces` and update proxy authentication without restarting the service. Settings are read once when the daemon specification is built; the settings action explicitly restarts a running service only when the resulting environment changes.

A hand edit is parsed through self-healing defaults. A malformed API-key list becomes empty and closes external access; malformed settings fall back to upstream-compatible defaults. Unknown keys are preserved by file-model merges.

## Dependencies

None. The package can run independently, while other services may depend on its `api` interface and `api` health check.

## Network Access and Interfaces

The package exports one `api` interface on port 8080 for both REST and WebSocket traffic. The upstream image has no authentication, so the TLS proxy leg requires a bearer token before traffic reaches the application.

Outside clients send `Authorization: Bearer <token>`. Same-box dependents should resolve the interface binding with `sdk.host.getBridgeAddress(..., { ssl: false })`; that plaintext bridge leg bypasses the TLS proxy and therefore needs no bearer token. They must not hardcode the internal port or a `.startos` hostname.

Adding or revoking a key rebinds the proxy in place. An empty token list intentionally rejects all outside requests while leaving same-box dependency traffic available.

## Installation and First-Run Flow

A fresh install starts locked to outside API clients and unlinked from Signal. Starting the service creates and claims the Signal config directory, launches the upstream s6 service tree, and becomes healthy once the account-list endpoint answers.

To make the service useful, link it as a secondary device to an existing Signal account. Create an API key only for software connecting through an address shown on the interface; same-box dependents do not need one.

## Actions

The package exposes setup, credential, configuration, diagnostic, and destructive operations. Action metadata in StartOS supplies their current availability and input schemas; the notes below cover effects and operational behavior.

### Create API Key

Run this before giving an outside client access. It appends a newly generated token to `store.json`, updates the proxy immediately without a service restart, and returns the token once as a masked, copyable value. Repeating it with another label safely creates an independent credential; labels must be unique.

### Link Signal Account

Run this during first setup or when linking another account. It requests a short-lived, single-use device-link URI from the live API and returns it as both a QR code and copyable value. Calling it again invalidates no stored Signal data; it simply requests a fresh link.

### List Signal Accounts

Use this to confirm linking, find the account number a client needs, inspect linked devices, or diagnose an untrusted contact key. It is read-only, safe to repeat, and normally completes in seconds.

### Revoke API Key

Run this when an outside client should lose access. It removes every stored key with the selected label and updates the proxy immediately without restarting the service. A key already removed produces no state change.

### Signal Settings

Use this for download suppression, identity trust policy, default text formatting, and log verbosity. It rewrites the settings section of `store.json`; a real change restarts a running service, while an unchanged save is a no-op. Repeating the same input is safe.

### Trust Identity

Run this after a contact's key becomes untrusted, commonly after that contact reinstalls Signal or changes phones. The verified path asks signal-cli to compare the entered safety number before trusting the key; the unverified path accepts all known keys for that contact. Repeating a successful trust is safe.

### Version Info

Use this while diagnosing API compatibility or evaluating an image update. It reads the running service's reported build, mode, supported API revisions, and endpoint capabilities without changing state.

### Delete All Accounts and Data

Stop the service and use this only when abandoning its local Signal identity. It removes the contents of `main`, including accounts, keys, contacts, attachments, and message data, while preserving API keys and settings on `startos`. Runtime scales with the volume size; repeating it against an empty volume is a no-op.

## Tasks

None. No setup prompt blocks the service from starting; account linking and optional outside-client credentials are exposed as ordinary actions.

## Health Checks

The displayed `api` check requests the live account-list endpoint, so success proves both the REST process and its connection to the resident signal-cli daemon are working. It uses the stable id `api`, which dependent services may require.

During startup, a failure normally means the JVM-backed Signal daemon is still initializing. A failure that persists beyond the startup grace period indicates an ownership problem, a crashed s6 child, or an invalid environment setting; inspect the service log for the first fatal line and verify `/data/signal-cli` is owned by uid/gid 1000.

## Backups and Restore

Backups copy both volumes wholesale while the service is stopped. This preserves the Signal identity and application data from `main` together with the proxy credentials and launch settings from `startos`.

A restore reinstates the package and both volumes at their backed-up version and leaves the service stopped. Start it after restore; no relinking or credential recreation should be necessary. Losing `main` requires linking a new device, while restoring `main` without `startos` would lose the corresponding outside-client credentials.

## Limitations and Differences

1. The package links an existing Signal account as a secondary device; it does not register a phone number because registration requires an out-of-band captcha.
2. Unlinking this secondary device is done from the primary Signal app. Deleting local package data does not remove the device from the account's linked-device list.
3. Account deletion is deliberately not exposed because it can irreversibly destroy the linked Signal account rather than merely reset this service.
4. Attachments cross the HTTP API as request data or attachment downloads. The package exposes no shared file volume to consumers.
5. Realtime receive requires json-rpc mode, so modes that spawn signal-cli for each request are unavailable.
6. The image supports multiple linked accounts; the package presents all accounts but does not enforce a single-account policy.

---

## Quick Reference for AI Consumers

```yaml
package_id: signal-messenger-bridge
image: bbernhard/signal-cli-rest-api
architectures: [x86_64, aarch64]
subcontainers: [signal-cli-sub]
volumes:
  main: /data
  startos: null
file_models:
  - store.json
startos_managed_env_vars:
  - MODE
  - SIGNAL_CLI_CONFIG_DIR
  - PORT
  - JSON_RPC_TRUST_NEW_IDENTITIES
  - DEFAULT_SIGNAL_TEXT_MODE
  - LOG_LEVEL
  - JSON_RPC_IGNORE_ATTACHMENTS
  - JSON_RPC_IGNORE_STORIES
  - JSON_RPC_IGNORE_AVATARS
  - JSON_RPC_IGNORE_STICKERS
dependencies: none
interfaces:
  api: { type: api, port: 8080 }
actions:
  - create-api-key
  - link-signal-account
  - list-signal-accounts
  - revoke-api-key
  - signal-settings
  - trust-identity
  - version-info
  - reset-data
tasks: none
health_checks:
  - api
```
