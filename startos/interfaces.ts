import { sdk } from './sdk'
import { i18n } from './i18n'
import { apiHostId, port } from './utils'
import { credentialsJson } from './fileModels/credentials.json'
import { storeJson } from './fileModels/store.json'

/**
 * The `api` interface id is a dependent-facing contract — consumers resolve it
 * to find the service — so treat it as a small public API.
 */
export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // Create/Revoke API Key updates proxy authentication without restarting the daemon.
  const apiKeys = await storeJson.read((s) => s.apiKeys).const(effects)
  const dependentKey = await credentialsJson
    .read((c) => c.apiKey)
    .const(effects)
  const tokens = [
    ...(dependentKey ? [dependentKey] : []),
    ...(apiKeys ?? []).map((k) => k.token),
  ]

  const lanMulti = sdk.MultiHost.of(effects, apiHostId)
  const lanOrigin = await lanMulti.bindPort(port, {
    protocol: 'http',
    // The upstream image ships no authentication of any kind, so this gate is
    // the only thing between the network and full control of the linked Signal
    // account. StartOS enforces it on the plaintext bridge address too, so
    // dependents send the key published on the `public` volume.
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
