import { sdk } from './sdk'

/**
 * The container's REST + WebSocket port (the image's `PORT` default). Shared by
 * `interfaces.ts`, the health check, and any in-package client, so the three
 * can't drift.
 */
export const port = 8080

/** Where the `main` volume is mounted. */
const dataDir = '/data'

/**
 * signal-cli's config dir. Pinned via `SIGNAL_CLI_CONFIG_DIR` rather than
 * inherited, so the layout this package backs up can't drift upstream. A
 * subdirectory, not the volume root, so the root can stay root-owned while
 * this alone is handed to uid 1000 — see claimConfigDir in main.ts.
 */
export const configDir = `${dataDir}/signal-cli`

/**
 * The uid/gid signal-cli runs as. Fixed by the image (`USER signal-api`), not
 * configurable, and re-check it on every bump — see UPDATING.md.
 */
export const containerUid = 1000
export const containerGid = 1000

/** The whole `main` volume. Consumers need no mounts of their own. */
export const mainMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: null,
  mountpoint: dataDir,
  readonly: false,
})
