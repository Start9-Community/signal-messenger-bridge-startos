<p align="center">
  <img src="icon.svg" alt="Signal Messenger Bridge Logo" width="21%">
</p>

# Signal Messenger Bridge on StartOS

> Everything not listed in this document should behave the same as upstream
> `signal-cli-rest-api`. If a feature, setting, or behavior is not mentioned
> here, the upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

This package runs a headless [Signal](https://signal.org) client
([`signal-cli`](https://github.com/AsamK/signal-cli), wrapped by
[`signal-cli-rest-api`](https://github.com/bbernhard/signal-cli-rest-api)) as a service and exposes the Signal network over a token-authenticated REST and WebSocket API, so another program can hold a Signal identity and send and receive messages and attachments on your behalf. It is infrastructure for a bot, not a chat client for a person.

- **Upstream repo:** <https://github.com/bbernhard/signal-cli-rest-api>
- **Wrapper repo:** <https://github.com/lundog/signal-messenger-bridge-startos>

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

The image is `bbernhard/signal-cli-rest-api`, pinned to an explicit tag in `startos/manifest/index.ts` — never `latest`, because the tag decides which `signal-cli` ships and an unpinned rebuild can change the API surface silently. Upstream's release *names* and its image *tags* are different numbering lines; `UPDATING.md` is the runbook for bumping and lists the five things to re-check each time.

**`MODE=json-rpc` is a requirement, not a preference.** It keeps one `signal-cli` daemon resident, which is what makes the realtime receive stream at `/v1/receive/{account}` available; the other modes spawn a process per request and can only poll.

**The image's entrypoint is bypassed.** Upstream runs s6-overlay, whose `/init` aborts with `can only run as pid 1` — a StartOS subcontainer's daemons are children of the runtime, never init. `main.ts` therefore runs the two processes s6 would have supervised, directly:

| Daemon | Command | Notes |
| --- | --- | --- |
| `signal-cli` | `jsonrpc2-helper` | Writes `jsonrpc2.yml`, then execs into `signal-cli daemon` on `127.0.0.1:6001`. It replaces itself, so this process *is* signal-cli; the JVM start is why the grace period is generous. |
| `signal-api` | `signal-cli-rest-api -signal-cli-config <dir>` | The REST and WebSocket server on port 8080. |

They start together, as under upstream's s6 — `signal-api` declares `requires: ['signal-cli']`, but signal-cli's `ready` is an immediate-success stub, so the gate opens at once. That stub exists because nothing cheap can observe the daemon: its JSON-RPC socket is on the container's loopback, and `checkPortListening` reads `/proc/net/tcp` in the *runtime's* network namespace, where only declared interface ports appear — so a real probe on 6001 would never open and would hang the start.

The dependency is declared for the **stop** path. `Daemons._term()` terminates in reverse dependency order; without it both daemons got SIGTERM together, and `signal-api` — which does not exit when its JSON-RPC peer disappears — reconnect-looped for 30s, aborted non-zero, and was restarted by the supervisor mid-shutdown.

Because the entrypoint is bypassed, the image's own `ENV` may not reach these commands. `computeStartEnv` in `startos/settings.ts` builds the entire environment explicitly — the fixed parts and the operator-settable ones alike.

The image is **rootless**: it declares `USER signal-api` (uid/gid 1000) and nothing inside it chowns anything. `claimConfigDir` in `main.ts` hands the config dir to 1000:1000 before the daemon launches, walking the tree only when the top-level owner is wrong. A root-owned config dir — which a fresh `mkdir` produces — makes signal-cli fail to start with no useful error.

## Volume and Data Layout

Two volumes, and the split is deliberate:

```
main    → /data                    mounted
          /data/signal-cli         signal-cli's config dir, uid 1000
startos → (no mountpoint)          store.json — nothing in the container can read it
```

`main` holds the Signal identity: registration keys, contacts, identities, and the message database. `SIGNAL_CLI_CONFIG_DIR` is pinned explicitly to `/data/signal-cli` rather than inherited from the image default, so the layout this package backs up cannot drift when upstream moves its defaults. It is a subdirectory rather than the volume root so the root can stay root-owned while that one directory is handed to the container's unprivileged user.

`startos` is **mountless by design**. The packaging guide puts package-owned state on a volume no subcontainer mounts, which keeps generated credentials out of a directory the application can read.

## File Models

One file: `store.json`, on the `startos` volume.

```ts
{
  apiKeys: { label: string; token: string }[]
  settings: {
    skipMedia: ('attachments' | 'stories' | 'avatars' | 'stickers')[]
    trustNewIdentities: 'on-first-use' | 'always' | 'never'
    defaultTextMode: 'normal' | 'styled'
    logLevel: 'debug' | 'info' | 'warn' | 'error'
  }
}
```

There is no second config file, because `signal-cli-rest-api` reads none of its own — every setting becomes an environment variable, so there is nothing to bind one to.

The two concerns share a file but are kept apart by **how each is read**, and both halves are load-bearing:

- `interfaces.ts` maps to `apiKeys` alone — `storeJson.read((s) => s.apiKeys).const(effects)` — so a settings write cannot re-run `setupInterfaces`.
- `readSettings()` uses `.once()`, so an API-key write cannot restart the container.

Drop either and an unrelated save starts causing restarts or re-binds.

Every field carries a zod `.catch()`, so a hand-edited or older-schema file still parses. Note that `apiKeys` catches at the *array* level: one malformed entry discards the whole key list rather than just itself, which closes the gate rather than leaving it ajar. `SETTINGS_DEFAULTS` is shared between the schema and `computeStartEnv` so an unwritten file and a saved-untouched form produce identical environments.

### Settings → environment

| Setting | Environment variable |
| --- | --- |
| `skipMedia` entries | `JSON_RPC_IGNORE_ATTACHMENTS` / `_STORIES` / `_AVATARS` / `_STICKERS` (only the selected ones are emitted) |
| `trustNewIdentities` | `JSON_RPC_TRUST_NEW_IDENTITIES` |
| `defaultTextMode` | `DEFAULT_SIGNAL_TEXT_MODE` |
| `logLevel` | `LOG_LEVEL` |

All are read by the image at launch and never re-read, so a change is inert until the container restarts. The **Signal Settings** action owns that restart: it diffs against the stored values, writes only on a real change, and restarts only when the service is running.

`JSON_RPC_TRUST_NEW_IDENTITIES` is the *only* way to set the trust policy in this mode — the REST route for it refuses json-rpc outright, so there is no second source of truth to reconcile.

## Dependencies

None. This package depends on nothing and is depended upon; see the health check below for the id a dependent should require.

## Network Access and Interfaces

One interface, `api`, on host `main`, port 8080, serving REST and the WebSocket receive stream on the same port.

Outside access is gated by **bearer tokens at the StartOS reverse proxy**, fed from `store.json`'s `apiKeys`. Clients send `Authorization: Bearer <token>`; anything without a valid token gets `401` and never reaches the container. This is not optional hardening — the upstream image ships no authentication of any kind, so anything that reaches port 8080 can send as the linked account and unlink devices.

Verified on hardware: bearer auth applies to the WebSocket upgrade too. Without a token the upgrade gets `401`; with one it gets `101` and JSON envelopes stream from `/v1/receive/{account}`. Deleting every key restores the `401` while on-box dependents keep working.

**On-box consumers bypass the proxy** by dialing the container's bridge IP directly (`effects.getContainerIp({})`), so a dependent on the same server needs no token. The tokens gate LAN and remote access.

Because `apiKeys` is read reactively, adding or removing a key re-runs `setupInterfaces` and updates the accepted-token set live — no restart, and the daemons are untouched.

## Installation and First-Run Flow

1. `seedApiKeys` runs on **install only** and writes one 32-character key, so the auth gate is active from the first start. It never re-seeds: deleting every key stays deleted.
2. `setInterfaces` binds port 8080 with that token set. Init order is load-bearing — the key must exist before the bind, or the first bind has an empty token set.
3. On first start, `main.ts` creates `/data/signal-cli` and hands it to uid 1000, then launches both daemons.
4. The service answers before any account is linked. `/v1/about` succeeds with zero accounts, which is why the health check probes it rather than anything account-shaped.
5. The operator runs **Link Signal Account** and scans the code from the Signal app.

## Actions

Each group is sorted by action **id**, not by registration order — see `AGENTS.md`. Ids are the kebab-case of their display names where practical; `reset-data` is the deliberate exception, since the literal id would be unwieldy and it sits alone in its group where sort is moot.

### General

#### API Keys — `api-keys`

`allowedStatuses: any`. A list of `{ label, token }`. A blank token is filled with a generated 32-character string on save. Writing the list re-binds the proxy's accepted tokens live.

#### Link Signal Account — `link-signal-account`

`allowedStatuses: only-running`. Takes a device name (default `StartOS`) and calls `GET /v1/qrcodelink/raw`, which returns the `sgnl://linkdevice?uuid=…&pub_key=…` URI as JSON. Rendered copyable and as a QR code, masked by default.

Parse the JSON rather than slicing the body: Go's JSON encoder HTML-escapes the `&` to `\u0026`, so a URI sliced out of the raw body fails silently on `pub_key`.

This is the whole account-setup story — see [Limitations](#limitations-and-differences).

#### List Signal Accounts — `list-signal-accounts`

`allowedStatuses: only-running`. `GET /v1/accounts`, then per account `GET /v1/devices/{number}` and `GET /v1/identities/{number}`, rendered as nested groups. Either nested call degrades to a note against that account rather than failing the whole listing.

Accounts, devices and identities are one action because both nested endpoints take an account number; a standalone list would have to enumerate accounts anyway. Signal truncates `last_seen_timestamp` to a day boundary, so device timestamps render date-only in UTC — a clock time would be invented.

#### Signal Settings — `signal-settings`

`allowedStatuses: any`. The env-backed settings above. Reports one of three outcomes: no changes, restarting, or takes-effect-on-next-start.

#### Trust Identity — `trust-identity`

`allowedStatuses: only-running`. `PUT /v1/identities/{number}/trust/{recipient}` — despite upstream's parameter name, the recipient may be a UUID, and this package sends one whenever a contact has no number.

The identity picker is a `dynamicSelect` populated from the live API when the form opens; account and contact are packed into one option because a `dynamicSelect` sees only `effects` and the saved prefill, never a sibling field. The API accepts *exactly one* of a verified safety number or `trust_all_known_keys` and rejects a request carrying both or neither, so the input is a union.

The safety-number field is deliberately free text. Prefilling it from what this package reports would defeat the comparison it exists to make.

#### Version Info — `version-info`

`allowedStatuses: only-running`. `GET /v1/about` — version, build, running `MODE`, supported API versions, and per-endpoint capabilities. `MODE` is the reason this exists rather than a nicety: nothing else surfaces whether json-rpc is in effect. A capability disappearing across an image bump is a silent break for whatever relied on it.

### Danger Zone

#### Delete All Accounts and Data — `reset-data`

`allowedStatuses: only-stopped`. Empties the `main` volume's contents, leaving the root (the mountpoint) in place. `main.ts` recreates and re-claims the config dir on the next start, so a wiped volume and a fresh install reach the same state.

It wipes the filesystem directly rather than calling `DELETE /v1/devices/{number}/local-data`, which needs the service running and which signal-cli refuses while the account is still registered. A consequence worth knowing: upstream's advice to unlink the device before deleting local data does not apply here. Removing a linked device is a primary-device operation needing no cooperation from this one, so either order works — but the device stays listed in the Signal app until removed there.

`store.json` needs no carve-out: it is on a different volume and untouched by construction.

## Tasks

None. Nothing here creates a critical or important task; linking is discoverable from the action list and from `instructions.md`.

## Health Checks

| Id | Displayed | Probe |
| --- | --- | --- |
| `signal-cli` (daemon `ready`) | no | Always succeeds. |
| `signal-api` (daemon `ready`) | no | `checkWebUrl` against `http://127.0.0.1:8080/v1/about`. |
| `api` (standalone) | yes | The same probe, under a stable id. |

The `api` standalone check exists because a daemon's own `ready` has no id a dependent can name in a `kind: 'running'` requirement. **Treat `api` — both the interface id and the health-check id — as a small public API.**

`signal-cli`'s check always succeeds on purpose. Its JSON-RPC socket is on the container's loopback and invisible to `checkPortListening`, and nothing cheap observes that daemon from outside; liveness is StartOS restarting it when it exits, the same guarantee s6 gave it.

## Backups and Restore

`setupBackups(['main', 'startos'])` — both volumes, whole. `main` holds the Signal identity, and `startos` holds the API keys; restoring `main` alone would return a working identity whose proxy tokens are gone.

A StartOS restore only runs against a package that is **not installed** — uninstall first. The backup carries the package payload as well as the volumes, so the restore reinstalls the `.s9pk` from the backup rather than re-fetching it, and returns package and data at the same version together.

`AGENTS.md` documents the on-disk volume paths and a hand-rolled `tar` procedure, useful when moving between package ids. Those archives contain Signal **identity keys** — anyone holding one can impersonate the device.

## Limitations and Differences

- **Device-linking only; no number registration.** This package joins an existing account as a secondary device. Registering a new number needs an out-of-band captcha solved in a desktop browser, which is a poor fit for an appliance. A dedicated bot identity is still reachable: register a spare number as an ordinary Signal account on a phone, then link this service to that.
- **Unlinking happens on the phone.** `DELETE /v1/devices/{number}/{deviceId}` acts from the *primary* device; this is a secondary. Removing the linked service from an account is done in the Signal app.
- **`POST /v1/unregister/{number}` is deliberately not exposed.** With `delete_account: true` it deletes the account from Signal's servers irreversibly — with a linked personal account that destroys the user's Signal identity rather than resetting a service.
- **No file-exchange mount contract, by design.** Attachments cross the HTTP API: outbound as `base64_attachments`, inbound from `/v1/attachments/{id}`. Consumers need no mounts, so there is no shared directory and no ownership problem.
- **`AUTO_RECEIVE_SCHEDULE` is never set.** Under json-rpc the image calls `log.Fatal` on it at startup, so the container would not come up at all.
- **Multi-account is presented as single-account but not enforced.** `/v1/accounts` returns an array and the image supports more than one; nothing here polices a count.
- **Trust changes are not live.** The per-account trust endpoint refuses json-rpc mode, so the policy is environment-only and a change restarts the service.

---

## Quick Reference for AI Consumers

```yaml
package_id: signal-messenger-bridge
image: bbernhard/signal-cli-rest-api # pinned tag; see UPDATING.md
architectures:
  - x86_64
  - aarch64
subcontainers:
  - signal-cli-sub
volumes:
  main: /data # /data/signal-cli is signal-cli's config dir, uid 1000
  startos: null # no mountpoint — store.json only
file_models:
  - store.json # { apiKeys: [{label, token}], settings: {...} } on the startos volume
startos_managed_env_vars: # computed per-start; see settings.ts
  - MODE # always json-rpc
  - SIGNAL_CLI_CONFIG_DIR
  - PORT
  - JSON_RPC_TRUST_NEW_IDENTITIES
  - DEFAULT_SIGNAL_TEXT_MODE
  - LOG_LEVEL
  - JSON_RPC_IGNORE_ATTACHMENTS # and _STORIES/_AVATARS/_STICKERS, only when selected
dependencies: []
interfaces:
  api: { type: api, port: 8080 } # bearer auth at the OS proxy; on-box callers bypass it
transport:
  rest: https://<address>/v2/send # and the rest of the upstream REST surface
  receive: wss://<address>/v1/receive/{account} # realtime stream, json-rpc mode only
  attachments: base64 in/out over HTTP — no shared volume
actions:
  - api-keys # any
  - link-signal-account # only-running
  - list-signal-accounts # only-running
  - signal-settings # any, restarts on a real change
  - trust-identity # only-running
  - version-info # only-running
  - reset-data # only-stopped, Danger Zone, irreversible
tasks: []
health_checks:
  - signal-cli # internal (display: null), always-success
  - signal-api # internal (display: null)
  - api # displayed; stable id for dependents to require
```
