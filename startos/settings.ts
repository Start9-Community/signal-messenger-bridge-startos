import { T } from '@start9labs/start-sdk'
import { sdk } from './sdk'
import {
  MediaKind,
  SETTINGS_DEFAULTS,
  SignalSettings,
  storeJson,
} from './fileModels/store.json'
import { configDir, port } from './utils'

/** `skipMedia` entry -> the env var that suppresses that download. */
const SKIP_MEDIA_ENV: Record<MediaKind, string> = {
  attachments: 'JSON_RPC_IGNORE_ATTACHMENTS',
  stories: 'JSON_RPC_IGNORE_STORIES',
  avatars: 'JSON_RPC_IGNORE_AVATARS',
  stickers: 'JSON_RPC_IGNORE_STICKERS',
}

/**
 * Current settings, with defaults for anything unwritten.
 *
 * `.once()`, deliberately, not `.const()`. `main` calls this to build the start
 * env, so a reactive read would restart the whole service on every write to
 * store.json — including an API-key change, which needs no restart at all. The
 * Signal Settings action restarts explicitly, and only when a value actually
 * changed, which is also what lets it tell the operator what it is doing.
 */
export async function readSettings(): Promise<SignalSettings> {
  const store = await storeJson.read().once()
  return { ...SETTINGS_DEFAULTS, ...(store?.settings ?? {}) }
}

/**
 * The environment both container processes launch with.
 *
 * Passed explicitly rather than inherited: the image's entrypoint is bypassed
 * (see main.ts), so its own `ENV` lines may not reach our commands. Anything
 * upstream gives a meaning to has to be added here — check the release-stage
 * `ENV` on every image bump.
 */
export function computeStartEnv(
  settings: SignalSettings,
): Record<string, string> {
  const env: Record<string, string> = {
    // json-rpc keeps one signal-cli daemon resident, which is what makes the
    // realtime receive stream on /v1/receive/{account} available. The other
    // modes spawn a process per request and can only poll. `jsonrpc2-helper`
    // rejects anything but json-rpc/json-rpc-native outright.
    MODE: 'json-rpc',
    // Pin the config dir rather than inheriting the image default, so the
    // volume layout this package backs up can't drift upstream.
    SIGNAL_CLI_CONFIG_DIR: configDir,
    // Pass the port explicitly rather than relying on the image's ENV reaching
    // a command that isn't the entrypoint; interfaces.ts binds this same value.
    PORT: String(port),
    // In json-rpc mode this is the only way to set the trust policy: the REST
    // endpoint for it (POST /v1/configuration/{number}/settings) returns "Not
    // supported in json-rpc mode, use the environment variable
    // JSON_RPC_TRUST_NEW_IDENTITIES instead". So there is no second source of
    // truth to reconcile against — api-config.yml is never written here.
    JSON_RPC_TRUST_NEW_IDENTITIES: settings.trustNewIdentities,
    DEFAULT_SIGNAL_TEXT_MODE: settings.defaultTextMode,
    LOG_LEVEL: settings.logLevel,
    // Deliberately NOT setting AUTO_RECEIVE_SCHEDULE: under json-rpc the image
    // calls log.Fatal on it at startup, so the container would not come up.
  }

  // Only emit the vars the operator asked for. The image defaults every one of
  // these to false, so an absent var and `false` are the same thing — sending
  // only the true ones keeps the env honest about what was actually chosen.
  for (const kind of settings.skipMedia) {
    env[SKIP_MEDIA_ENV[kind]] = 'true'
  }

  return env
}

/** True when the two settings objects would produce the same container env. */
export function settingsEqual(a: SignalSettings, b: SignalSettings): boolean {
  const envA = computeStartEnv(a)
  const envB = computeStartEnv(b)
  const keys = new Set([...Object.keys(envA), ...Object.keys(envB)])
  for (const key of keys) {
    if (envA[key] !== envB[key]) return false
  }
  return true
}

/**
 * Whether the service is running, and so needs restarting to apply a change.
 *
 * `desired`, not an observed state: what matters is whether the operator has
 * this service switched on. A container that is mid-restart or briefly down
 * still wants the new env, and a stopped one will pick it up on next start.
 */
export async function isRunning(effects: T.Effects): Promise<boolean> {
  const status = await sdk.getStatus(effects).once()
  return status?.desired.main === 'running'
}
