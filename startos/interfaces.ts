import { sdk } from './sdk'
import { i18n } from './i18n'
import { port } from './utils'
import { storeJson } from './fileModels/store.json'

/**
 * The `api` interface id is a dependent-facing contract — consumers resolve it
 * to find the service — so treat it as a small public API.
 */
export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // Read the API keys reactively: when the API Keys action rewrites them,
  // setupInterfaces re-runs and the OS reverse proxy picks up the new token
  // set. No restart, and the daemon is untouched.
  const apiKeys = await storeJson.read((s) => s.apiKeys).const(effects)
  const tokens = (apiKeys ?? []).map((k) => k.token)

  const lanMulti = sdk.MultiHost.of(effects, 'main')
  const lanOrigin = await lanMulti.bindPort(port, {
    protocol: 'http',
    // The upstream image ships no authentication of any kind, so this gate is
    // the only thing between the network and full control of the linked Signal
    // account. Bearer auth is enforced at the StartOS reverse proxy: outside
    // clients must send `Authorization: Bearer <token>` or get 401 before
    // reaching the container. Same-box dependents bypass it by dialing the
    // container's bridge IP directly — that path doesn't traverse the proxy.
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
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  return [await lanOrigin.export([api])]
})
