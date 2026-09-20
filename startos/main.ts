import { lchown, mkdir, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { sdk } from './sdk'
import { i18n } from './i18n'
import { computeStartEnv, readSettings } from './settings'
import {
  configDir,
  containerGid,
  containerUid,
  mainMounts,
  port,
} from './utils'

/**
 * Give signal-cli's config dir to the container's unprivileged user.
 *
 * The image ran as root and chowned this itself until 0.101, which moved to a
 * rootless image and dropped `SIGNAL_CLI_CHOWN_ON_STARTUP` along with the uid
 * env vars. A container that starts as uid 1000 cannot fix ownership, so if we
 * hand it a root-owned directory — which is what our own `mkdir` produces on a
 * fresh install — signal-cli fails to start with no useful error.
 *
 * Only this subtree changes hands; the volume root stays root-owned and merely
 * traversable, so nothing the package writes there is the container's to edit.
 *
 * The top-level owner is the guard: our `mkdir` and a backup restored without
 * `--numeric-owner` both leave it wrong, and both want the same full walk. A
 * tree already owned by 1000 is the steady state and skips it, so an unbounded
 * chown doesn't run on every start over a large message database.
 */
async function claimConfigDir(dir: string): Promise<void> {
  const top = await stat(dir)
  if (top.uid === containerUid && top.gid === containerGid) return

  console.info(`Handing ${configDir} to uid ${containerUid}`)
  const walk = async (path: string): Promise<void> => {
    // lchown, not chown: never follow a symlink out of the volume.
    await lchown(path, containerUid, containerGid)
    const entries = await readdir(path, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) await walk(join(path, entry.name))
      else await lchown(join(path, entry.name), containerUid, containerGid)
    }
  }
  await walk(dir)
}

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Signal Messenger Bridge!'))

  // signal-cli's config dir is a subdirectory of the volume, so on a fresh
  // install it doesn't exist yet. Create it before the daemon starts, then give
  // it to the container's user — the rootless image can't do either itself.
  const hostConfigDir = sdk.volumes.main.subpath('signal-cli')
  await mkdir(hostConfigDir, { recursive: true })
  await claimConfigDir(hostConfigDir)

  const subcontainer = sdk.SubContainer.of(
    effects,
    { imageId: 'signal-cli' },
    mainMounts,
    'signal-cli-sub',
  )

  // The image's entrypoint is s6-overlay's `/init`, which aborts with "can only
  // run as pid 1" under StartOS, since a subcontainer's daemons are children of
  // the runtime rather than init. So we run the two processes s6 would have
  // supervised, directly. They are the whole of it — `s6-services/signal-api/run`
  // and `s6-services/signal-json-rpc/run` each exec a single binary.
  //
  // Both get the same env. `jsonrpc2-helper` owns the JSON_RPC_* vars and the
  // REST binary owns PORT and the text mode, but neither minds the other's, and
  // one env means one place to add a var on an image bump.
  const env = computeStartEnv(await readSettings())

  return (
    sdk.Daemons.of(effects)
      // Writes jsonrpc2.yml into the config dir, then execs into
      // `signal-cli daemon` listening on 127.0.0.1:6001. It replaces itself, so
      // this process *is* signal-cli — the JVM start is why the grace period is
      // generous.
      .addDaemon('signal-cli', {
        subcontainer,
        exec: { command: ['jsonrpc2-helper'], env },
        ready: {
          display: null,
          // A stub: port 6001 is on the container's loopback and invisible to
          // `checkPortListening`, which reads the *runtime's* /proc/net/tcp.
          // Liveness is StartOS restarting the process when it exits, the same
          // guarantee s6 gave. See AGENTS.md.
          fn: async () => ({
            result: 'success',
            message: i18n('Not observable from outside the container'),
          }),
          gracePeriod: 45_000,
        },
        requires: [],
      })
      // `requires` here is for the *stop* path, not the start: signal-cli's
      // ready is an immediate stub, so the gate opens at once. Without it both
      // daemons got SIGTERM together and signal-api — which does not exit when
      // its JSON-RPC peer disappears — aborted non-zero and was restarted
      // mid-shutdown. See AGENTS.md.
      .addDaemon('signal-api', {
        subcontainer,
        exec: {
          command: ['signal-cli-rest-api', '-signal-cli-config', configDir],
          env,
        },
        ready: {
          // Surfaced to users (and dependents) via the `api` health check below.
          display: null,
          fn: () => probe(),
          gracePeriod: 45_000,
        },
        requires: ['signal-cli'],
      })
      // Standalone health check with a stable id that dependent packages can
      // name in a `kind: 'running'` requirement. A daemon's own `ready` has no
      // such id, which is why the probe is declared twice.
      .addHealthCheck('api', {
        ready: {
          display: i18n('API'),
          fn: () => probe(),
        },
        requires: ['signal-api'],
      })
  )

  // The daemon answers before any account is linked, so this must not depend on
  // one existing. `/v1/about` reports version and capabilities and is what
  // OpenClaw's container client probes.
  function probe() {
    return sdk.healthCheck.checkWebUrl(
      effects,
      `http://127.0.0.1:${port}/v1/about`,
      {
        successMessage: i18n('Signal API is ready'),
        errorMessage: i18n('Signal API is not ready'),
      },
    )
  }
})
