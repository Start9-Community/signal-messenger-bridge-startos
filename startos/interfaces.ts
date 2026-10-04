import { sdk } from './sdk'
import { i18n } from './i18n'
import { port } from './utils'
import { storeJson } from './fileModels/store.json'

/**
 * The `api` interface id is a dependent-facing contract — consumers resolve it
 * to find the service — so treat it as a small public API.
 */
export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // Create/Revoke API Key updates proxy authentication without restarting the daemon.
  const apiKeys = await storeJson.read((s) => s.apiKeys).const(effects)
  const tokens = (apiKeys ?? []).map((k) => k.token)

  const lanMulti = sdk.MultiHost.of(effects, 'main')
  const lanOrigin = await lanMulti.bindPort(port, {
    protocol: 'http',
    // The upstream image ships no authentication of any kind, so this gate is
    // the only thing between the network and full control of the linked Signal
    // account. Same-box dependents resolve the binding's plaintext bridge leg,
    // which does not traverse this TLS proxy.
    addSsl: {
      auth: { type: 'bearer', tokens, realm: 'Signal Messenger Bridge' },
    },
  })

  const api = sdk.createInterface(effects, {
    name: i18n('API'),
    id: 'api',
    description: i18n(
      'Token-authenticated REST and WebSocket API for sending and receiving Signal messages',
    ),
    type: 'api',
    masked: true,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  return [await lanOrigin.export([api])]
})
