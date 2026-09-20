# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent ("prompt the user to create
admin credentials", "expose a web UI") to the constructs, the reference pages, and a named production
package to copy. Find the recipe before you read this package's neighbours: a package you reach by
grepping may be non-conformant, and the recipe outranks it.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (technical reference for an AI support or administering agent) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- Package id is `signal-messenger-bridge`; the `api` interface and standalone `api` health-check ids are dependent-facing contracts.
- Keep `MODE=json-rpc`; the realtime receive stream depends on its resident `signal-cli` daemon.
- Never set `AUTO_RECEIVE_SCHEDULE` or `SIGNAL_CLI_CMD_TIMEOUT` in json-rpc mode; upstream treats either as a fatal configuration error.
- The image runs as uid/gid 1000, so the ownership oneshot must precede the daemon.
- Check the image's s6 services, runtime user, and environment variables on every bump; `UPDATING.md` contains the runbook.
