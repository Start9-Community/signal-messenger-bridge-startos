import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

/** Media signal-cli downloads automatically unless told not to. */
export const MEDIA_KINDS = [
  'attachments',
  'stories',
  'avatars',
  'stickers',
] as const
export type MediaKind = (typeof MEDIA_KINDS)[number]

const TRUST_MODES = ['on-first-use', 'always', 'never'] as const
const TEXT_MODES = ['normal', 'styled'] as const
const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const

/**
 * Container settings the operator can change.
 *
 * Every one of these is read by the image at launch only, so a change implies a
 * restart — see the Signal Settings action, which owns that decision. Defaults
 * match the image's own, so an unwritten file and a saved-untouched form
 * produce identical env.
 */
const settingsShape = z.looseObject({
  // Selected kinds are NOT downloaded (the env vars are `JSON_RPC_IGNORE_*`).
  // Stored in the env's polarity so the mapping stays a lookup, not a negation.
  skipMedia: z.array(z.enum(MEDIA_KINDS)).catch([]),
  trustNewIdentities: z.enum(TRUST_MODES).catch('on-first-use'),
  defaultTextMode: z.enum(TEXT_MODES).catch('normal'),
  logLevel: z.enum(LOG_LEVELS).catch('info'),
})

export type SignalSettings = z.infer<typeof settingsShape>

/**
 * Shared by the zod `.catch()`es above and by `computeStartEnv`, so a file that
 * predates a field and a file that never existed both start the container the
 * same way.
 */
export const SETTINGS_DEFAULTS: SignalSettings = {
  skipMedia: [],
  trustNewIdentities: 'on-first-use',
  defaultTextMode: 'normal',
  logLevel: 'info',
}

const shape = z.looseObject({
  // Bearer tokens accepted by the OS reverse proxy on the `api` interface.
  // Each has a user-facing label; the proxy only ever sees the token strings.
  apiKeys: z
    .array(z.looseObject({ label: z.string(), token: z.string() }))
    .catch([]),
  settings: settingsShape.catch(SETTINGS_DEFAULTS),
})

/**
 * Package-owned state, on the mountless `startos` volume so nothing in the
 * container can read the proxy tokens.
 *
 * `apiKeys` and `settings` share one file, kept apart by how each is read:
 * `interfaces.ts` maps to `apiKeys` alone so a settings write cannot re-bind
 * the proxy, and `settings.ts` reads with `.once()` so a key write cannot
 * restart the container. Both halves are load-bearing.
 */
export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: '/store.json' },
  shape,
)
