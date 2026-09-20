# Updating the upstream version

Signal Messenger Bridge runs [`bbernhard/signal-cli-rest-api`](https://github.com/bbernhard/signal-cli-rest-api),
which wraps [`signal-cli`](https://github.com/AsamK/signal-cli). "Upstream" here means that image;
this repo consumes it via `dockerTag` and does not build it. The pin lives in
`startos/manifest/index.ts` at `images['signal-cli'].source.dockerTag`.

## Release tags and image tags are different numbers

The GitHub release named **0.101** is git tag `0.101-pre`, and its image is
`bbernhard/signal-cli-rest-api:0.203-dev`. Pre-releases use a separate numbering line
(`0.199-dev`, `0.200-dev`, `0.202-dev`, `0.203-dev`) that does not match the release name at all.
Stable releases are simpler — release 0.100 is image tag `0.100`.

So read the release notes for the change list, but take the image tag from the sentence inside the
release body, never from the release title. Confirm it exists before pinning:

```sh
curl -fsSL "https://hub.docker.com/v2/repositories/bbernhard/signal-cli-rest-api/tags?page_size=50&ordering=last_updated" \
  | jq -r '.results[].name'
```

Prefer a stable tag, and do not ship a `-dev` pin **unless no other tag works**. This package's
volume holds Signal identity keys, so a moving pre-release is a poor thing to stand on — but the
rule is "prefer stable", not "stable only". `0.203-dev` is the current pin precisely because it is
the only tag carrying the rootless/s6 image that the ownership oneshot and `runAsInit` daemon in
`main.ts` target; no stable tag has it yet. When you must pin a pre-release, say so in the release
notes and revisit on the next upstream release.

## What to re-check on every bump

**1. Does the container still start as uid 1000, and does anything still chown for us?**

This is the one that breaks silently. Through 0.100 the image ran as root, chowned
`SIGNAL_CLI_CONFIG_DIR` on every start, then dropped privileges — controlled by `SIGNAL_CLI_UID`,
`SIGNAL_CLI_GID`, and `SIGNAL_CLI_CHOWN_ON_STARTUP`. 0.101 merged the rootless image into master,
declared `USER signal-api`, and **removed all three**. Nothing in the image chowns anything now, so
`main.ts` does it (`claimConfigDir`) before the daemon starts.

If a future bump changes the uid, reintroduces a chown, or moves to a different user model, update
`containerUid`/`containerGid` in `startos/utils.ts` and revisit the `claim-config-dir` oneshot in
`main.ts`. Check the release-stage `USER` line and the `useradd` call in the upstream `Dockerfile`.

**2. Did the entrypoint or its supervised processes change?**

The daemon runs the image's s6-overlay `/init` with `runAsInit: true`, which makes it PID 1 and
preserves upstream's service supervision. The `s6-services/` directory is therefore part of this
package's contract. Read each `run` script at the new tag and confirm it still starts the expected
JSON-RPC helper and REST process.

If upstream adds a service, flag, or s6 oneshot, the entrypoint picks it up automatically, but the
package's environment and health probe may need to change. Also check the release-stage `ENV` lines;
load-bearing values are passed explicitly from `main.ts` rather than relying on image defaults.

**3. Are `MODE` and `SIGNAL_CLI_CONFIG_DIR` still honored?**

Both are contracts this package depends on. Under s6 they are read by
`s6-services/signal-json-rpc/run` (branches on `$MODE`) and `s6-services/signal-api/run`
(`-signal-cli-config="${SIGNAL_CLI_CONFIG_DIR}"`). `MODE=json-rpc` is required, not a preference —
see `AGENTS.md`.

**4. Did signal-cli or libsignal-client jump?**

Read `SIGNAL_CLI_VERSION` and `LIBSIGNAL_CLIENT_VERSION` from the upstream `Dockerfile` at the tag.
signal-cli migrates its database forward and does not migrate back, so a large jump means the
downgrade path is one-way. Decide `migrations.down` in `startos/versions/current.ts` deliberately
rather than inheriting it, and say so in the release notes if a rollback needs a restore.

**5. Did the REST surface change under us?**

Pull the swagger from a running container and diff the paths against the last bump:

```sh
curl -s http://localhost:8080/swagger/doc.json | jq -r '.paths | keys[]'
```

The Version Info action surfaces `version`, `mode`, and per-endpoint `capabilities` from
`/v1/about` — a capability disappearing is a silent break for whatever depended on it.

## Applying the bump

1. Update `dockerTag` in `startos/manifest/index.ts`.
2. Work through the five checks above; fix anything they surface before building.
3. Bump `version` and write `releaseNotes` in `startos/versions/current.ts` (all five locales).
4. Build, sideload, and **verify the service starts and `List Signal Accounts` still lists the linked
   account** — a permissions or entrypoint regression looks exactly like a broken link.
