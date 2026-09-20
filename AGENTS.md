# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Keep `README.md` (architecture, for developers and LLMs) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Package id is `signal-messenger-bridge`.** It runs a headless Signal client (`bbernhard/signal-cli-rest-api`, which wraps `signal-cli`) and exposes the Signal network over a REST + WebSocket API (interface id `api` on host `main`, port 8080).
- **The `api` interface and the `api` standalone health check are a dependent-facing contract.** Dependents reference the health-check id in a `kind: 'running'` requirement — treat both ids as a small API and update consumers if you rename them.
- **An action's id is also its sort key, so prefer ids that match their display name.** StartOS 0.4.0 orders each action group by **id**, not by registration order — the docstring on `sdk.Actions.of` says otherwise and is wrong; verified on hardware. Naming the id as the kebab-case of the display name (`list-signal-accounts` ↔ "List Signal Accounts") keeps the two greppable together and makes the displayed order predictable from the names alone; in `General` it happens to read setup → upkeep → read-only diagnostics last. **Preferred, not required**: `reset-data` displays as "Delete All Accounts and Data" because the literal id would be unwieldy and it sits alone in `Danger Zone`, where sort is moot. When adding or renaming an action, work out where its id lands in the sorted group, and remember the id shows up in `start-cli` and task references.
- **`MODE=json-rpc` is required, not a preference.** It keeps one `signal-cli` daemon resident, which is what makes the realtime receive stream at `/v1/receive/{account}` available; the other modes spawn a process per request and can only poll. OpenClaw's Signal channel in `apiMode: "container"` depends on this.
- **Never set `AUTO_RECEIVE_SCHEDULE`.** Under `MODE=json-rpc` the image calls `log.Fatal` on it at startup (`src/main.go`), so the container does not come up at all — it is not merely the message loss upstream's README warns about for normal/native mode. Same treatment for `SIGNAL_CLI_CMD_TIMEOUT`, and `RECEIVE_WEBHOOK_URL` is fatal in the other direction (json-rpc only).
- **`SIGNAL_CLI_CONFIG_DIR` is pinned explicitly** to the mountpoint in `utils.ts` rather than inherited from the image default, so the volume layout this package backs up can't drift when upstream moves its defaults.
- **There is no file-exchange mount contract, and there shouldn't be one.** Attachments cross the HTTP API: outbound as `base64_attachments` on `/v2/send`, inbound fetched from `/v1/attachments/{id}`. Consumers need no mounts, so there is no shared directory, no ownership/mode problem, and nothing for a consumer to stage into.
- **The upstream image ships no authentication of any kind.** Anything that reaches port 8080 can send as the linked account and unlink devices. The gate is the StartOS reverse proxy (`addSsl.auth` bearer tokens) fed from API keys. Same-box dependents bypass the proxy by dialing the container bridge IP directly.
- **The image is rootless as of 0.101 and this package has to chown for it.** It declares `USER signal-api` (uid/gid 1000). A container starting as uid 1000 cannot fix ownership, so `claimConfigDir` in `main.ts` hands `SIGNAL_CLI_CONFIG_DIR` to 1000:1000 before the daemon launches — a root-owned config dir, which is what our own `mkdir` produces on a fresh install, makes signal-cli fail to start with no useful error. The volume root stays root-owned and merely traversable. Re-check this on every image bump; see `UPDATING.md`.
- **The image entrypoint is not used, and can't be.** 0.101 swapped `supervisor` for s6-overlay, so the entrypoint is `/init`, which aborts with `s6-overlay-suexec: fatal: can only run as pid 1` — a StartOS subcontainer's daemons are children of the runtime, never init. `main.ts` therefore runs the two processes s6 would have supervised, directly: `jsonrpc2-helper` (writes `jsonrpc2.yml`, then execs into `signal-cli daemon` on `127.0.0.1:6001`) and `signal-cli-rest-api -signal-cli-config <dir>`. Upstream's `s6-services/*/run` scripts are one `exec` each, so nothing is lost.
- **Never gate a daemon on `checkPortListening(6001)`.** signal-cli's JSON-RPC socket is on the container's loopback, and `sdk.healthCheck.checkPortListening` reads `/proc/net/tcp` in the **runtime's** network namespace, where only declared interface ports appear. Port 6001 is invisible there, so such a gate never opens and the start hangs. Nothing cheap observes that daemon from outside, which is why `signal-cli`'s `ready` is an immediate-success stub; liveness is StartOS restarting it when it exits, the same guarantee s6 gave.
- **`signal-api` does `requires: ['signal-cli']`, and that is about stopping, not starting.** The start is unaffected — signal-cli's `ready` returns success immediately, so the gate opens at once and the two still come up together, as under upstream's s6. The stop is the point: `Daemons._term()` terminates in reverse dependency order, batching every daemon that nothing remaining depends on, so without the dependency both got SIGTERM together and `signal-api` outlived `signal-cli`. It does **not** exit when its JSON-RPC peer disappears — it reconnect-loops for ~30s, then aborts with a *non-zero* status, and StartOS restarts anything that exits, so a stop produced a spurious restart mid-shutdown plus a minute of `ECONNREFUSED` health-check noise. Declaring the dependency stops `signal-api` first. The coupling is real regardless; this only makes StartOS manage it instead of letting it surface as a crash.
- **Stopping a *fresh, unlinked* install needed a SIGKILL after ~60s.** signal-cli logged its shutdown hook and then never exited; `exec.sigtermTimeout` (default 30s) is the bound if one is ever wanted. Observed only with no account linked, where the daemon has nothing to service — **unconfirmed on a linked install**, so do not tune a timeout around it until there is a data point from a real account.
- **Because the entrypoint is bypassed, the image's `ENV` may not reach our commands.** `computeStartEnv` in `settings.ts` builds the whole environment both daemons launch with — the fixed parts (`MODE`, `SIGNAL_CLI_CONFIG_DIR`, `PORT`) and the operator-settable ones. Any env upstream adds a meaning to must be added there too; check the release-stage `ENV` lines on every bump.
- **`JSON_RPC_TRUST_NEW_IDENTITIES` is the only way to set the trust policy in this mode.** The REST route for it, `POST /v1/configuration/{number}/settings`, answers *"Not supported in json-rpc mode, use the environment variable JSON_RPC_TRUST_NEW_IDENTITIES instead"* (`src/client/client.go`). So `api-config.yml` is never written and there is no second source of truth to reconcile — unlike the drift a live-settable setting would create. Conversely `POST /v1/configuration` (log level) *is* live but purely in-memory, so it reverts on restart and is not a place to store anything.
- **Trust Identity is needed on the default trust setting, not only on `never`.** `on-first-use` is TOFU: the first key seen for a contact is accepted silently, but a key that *changes* is not — it goes `UNTRUSTED` and sends to that contact fail with signal-cli exit code 4, "Sending failed due to untrusted key". A contact reinstalling Signal or switching phones is the ordinary trigger, and it happens on the out-of-the-box configuration. `never` additionally blocks the *first* key, which is why that option can't be offered without this action, but it is not the only reason the action exists. `listIdentities` and `trust` both work in json-rpc mode. The safety-number field is deliberately free text: prefilling it from what this service reports would defeat the comparison it exists to make — signal-cli rejects a number that doesn't match the key it holds, so a wrong entry fails loudly.
- **`store.json` on the mountless `startos` volume is this package's only state file.** It holds the bearer tokens the OS reverse proxy checks and the settings that become container env. There is no second config file, because signal-cli-rest-api reads none of its own to bind one to. The two concerns share a file but are kept apart by **how each is read**, and both halves are load-bearing: `interfaces.ts` maps to `apiKeys` alone (`storeJson.read((s) => s.apiKeys).const(effects)`) so a settings write cannot re-run `setupInterfaces`, and `readSettings()` uses `.once()` so an API-key write cannot restart the container. Drop either and an unrelated save starts causing restarts or re-binds. The packaging guide is explicit that package-owned state belongs on a volume no subcontainer mounts — keeping generated credentials out of a directory the application can read. `manifest` declares `volumes: ['main', 'startos']` and gives `startos` no mountpoint; `backups.ts` covers both, since restoring `main` alone would return a working Signal identity whose proxy tokens are gone.
- **Settings are launch-time env, so the Signal Settings action owns the restart.** Every exposed setting is read by the image at startup and never re-read. The action diffs the new values against the stored ones, writes only on a real change, and restarts only when the service is running — which is why `main` reads them with `.once()` rather than reactively. A reactive read would restart on every write, including no-op saves, and take the honest "no changes" / "takes effect on next start" messages away from the operator.

- **Account setup is device-linking only.** `/v1/qrcodelink` links the service to an existing account as a secondary device. Registering a new number is deliberately out of scope: it needs an out-of-band captcha that can't be solved inside the StartOS UI. A dedicated bot identity is still reachable — register a spare number as a normal Signal account on a phone, then link the service to that.

## Versions when iterating

Sideloading a build whose version sorts **below** the installed one is a downgrade, and it fails at install with:

```
uninit target range `!` is unsatisfiable — no version can satisfy it (host contract violation)
```

That is the version graph working, not a bug: the host asks the installed package to migrate its data down to the incoming version, `migrations.down` is `IMPOSSIBLE`, and no version in the graph satisfies the target. Beware prerelease suffixes in particular — `0.1.0:0-alpha` sorts *below* `0.1.0:0`, so it reads as a downgrade even though it looks newer. Check with the SDK's own comparator if unsure:

```bash
node -e "const {ExtendedVersion:V}=require('@start9labs/start-sdk');console.log(V.parse('0.1.0:0').compare(V.parse('0.1.0:0-alpha')))"
```

When iterating on hardware, a bare `-alpha` suffix is enough and the version does **not** need
bumping per build: sideloading re-installs the same version with a different binary. Only a version
that sorts *lower* is rejected.

### This package's version line

The version tracks the upstream release **name**, and that name currently carries a prerelease
marker of its own. Upstream release 0.101 is git tag `0.101-pre` with image tag `0.203-dev`; earlier
releases matched their tags and then followed with a non-`pre` tag, so 0.101 looks mislabeled and
may yet be re-cut. `0.101-pre` is therefore deliberate — it leaves room for a corrected `0.101`
above it.

```
0.101-pre:0-alpha  <  0.101-pre:0  <  0.101:0
```

The image tag still belongs in `manifest/index.ts` alone — `0.203-dev` never appears here.

### The one-way step onto this line

`-pre` is a prerelease on the *upstream* part, and comparison is lexicographic by part: the upstream
version is decided before the revision is consulted. So **nothing** on the `0.101-pre` line can
clear a `0.101.0` build — not `0.101-pre:9`, not any suffix:

```
0.101-pre:9  <  0.101.0:0-alpha
```

A box already running `0.101.0:*` must be **uninstalled** before it can take a `0.101-pre` build.
Do not carry the identity across on a StartOS backup: a restore brings the package back at the
backed-up version, landing you right back on `0.101.0`. Use the hand-rolled `tar` of `data/main`
below instead. `store.json` goes with the `startos` volume, which is fine — the reinstall is a
genuine fresh install, so `seedApiKeys` runs and mints a key.

Check any ordering with the SDK's own comparator rather than reasoning about it; note it returns
`'less'`/`'greater'`/`'equal'`, not a number.

## Restoring from a StartOS backup

A StartOS restore only runs against a package that is **not installed** — uninstall first, then
`System → Restore from Backup`. The backup carries the package payload as well as the volumes, so
the restore reinstalls the `.s9pk` from the backup rather than fetching it from a registry. That is
what makes this package restorable at all: it is sideloaded and published nowhere, so there is
nothing online to re-fetch. It is also why a restore of this service is slow out of proportion to
its data — the ~15 MB of Signal state is dwarfed by the image, and the restore is dominated by
laying that down.

Two consequences for reasoning about upgrades:

- A restore returns the package **and** its data at the backed-up version, together, so `setupOnInit`
  sees `kind === 'restore'` with no version transition and no migration. A restore cannot by itself
  land the service in a state its own version wouldn't produce.
- The payload is architecture-specific. A backup restored onto a different architecture runs under
  emulation until the package is reinstalled from a registry — not a concern while this package is
  sideloaded, but it means an x86 backup is not a portable artifact.

## Inspecting a running install

To run a command inside the service's container, use `start-cli package attach signal-messenger-bridge -n signal-cli-sub -- <cmd>`. Select the subcontainer by **name** with `-n` (the name passed to `SubContainer.of` in `main.ts` — here `signal-cli-sub`) or by image with `-i`. Note: `-s/--subcontainer` matches the internal **Guid**, not the name, so passing a name to `-s` fails with "no matching subcontainers".

## Volume path on the host

Package volumes live at:

```
/media/startos/data/package-data/volumes/<package-id>/data/main
```

Verified on StartOS 0.4.0. That directory is the **volume root** — what the container sees as `/data` (`mountpoint: dataDir`, `subpath: null` in `utils.ts`). It is not the signal-cli config dir; that is one level down:

```
…/data/main/                 → /data              (root-owned)
…/data/main/signal-cli/      → /data/signal-cli   signal-cli's config dir, uid 1000
…/data/startos/              → not mounted        store.json, the API keys
```

`SIGNAL_CLI_CONFIG_DIR` is handed to uid 1000 (see `claimConfigDir`) while the volume root stays root-owned. `store.json` is not on this volume at all — it is on the mountless `startos` volume, so nothing in the container can read it.

Backing it up by hand — useful when moving between package ids, since a renamed package installs fresh with an empty volume. This archives the Signal identity only; `store.json` lives on the other volume and is re-seeded on a fresh install:

```bash
start-cli package stop signal-messenger-bridge
tar -czpf /home/start9/signal-bridge-$(date +%Y%m%d-%H%M%S).tar.gz --numeric-owner \
  -C /media/startos/data/package-data/volumes/signal-messenger-bridge/data/main .
```

Restoring into a fresh install (the target directory only exists once the package is installed):

```bash
start-cli package stop signal-messenger-bridge
tar -xzpf /home/start9/signal-bridge-<timestamp>.tar.gz --numeric-owner \
  -C /media/startos/data/package-data/volumes/signal-messenger-bridge/data/main
start-cli package start signal-messenger-bridge
```

`--numeric-owner` preserves uid 1000 on the `signal-cli/` subtree; there's no matching user on the host. If an archive does land with the wrong ownership, `claimConfigDir` repairs the config dir on the next start — it walks whenever the top-level owner isn't 1000.

The archive contains Signal **identity keys** — anyone holding it can impersonate the device, so don't leave it on shared storage.
