import { sdk } from './sdk'
import { i18n } from './i18n'
import { computeStartEnv, readSettings } from './settings'
import { listAccounts } from './signal-client'
import { containerGid, containerUid, mainMounts } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Signal Messenger Bridge!'))

  const subcontainer = sdk.SubContainer.of(
    effects,
    { imageId: 'signal-cli' },
    mainMounts,
    'signal-cli-sub',
  )
  const env = computeStartEnv(await readSettings())

  return sdk.Daemons.of(effects)
    .addOneshot('claim-config-dir', {
      subcontainer,
      exec: {
        command: [
          '/bin/sh',
          '-c',
          `mkdir -p "$SIGNAL_CLI_CONFIG_DIR" && { [ "$(stat -c %u:%g "$SIGNAL_CLI_CONFIG_DIR")" = "${containerUid}:${containerGid}" ] || chown -R ${containerUid}:${containerGid} "$SIGNAL_CLI_CONFIG_DIR"; }`,
        ],
        env,
        user: 'root',
      },
      requires: [],
    })
    .addDaemon('signal-api', {
      subcontainer,
      exec: {
        command: sdk.useEntrypoint(),
        env,
        runAsInit: true,
      },
      ready: {
        display: null,
        fn: () => probe(),
        gracePeriod: 45_000,
      },
      requires: ['claim-config-dir'],
    })
    .addHealthCheck('api', {
      ready: {
        display: i18n('API'),
        fn: () => probe(),
      },
      requires: ['signal-api'],
    })

  async function probe() {
    try {
      await listAccounts(effects)
      return {
        result: 'success' as const,
        message: i18n('Signal API is ready'),
      }
    } catch {
      return {
        result: 'failure' as const,
        message: i18n('Signal API is not ready'),
      }
    }
  }
})
