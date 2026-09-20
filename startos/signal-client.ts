import { T } from '@start9labs/start-sdk'
import { port } from './utils'

/**
 * Minimal HTTP client for the signal-cli-rest-api container.
 *
 * Dials the container's own address directly, which is what lets this package
 * skip the bearer token: the API keys on the `startos` volume gate the reverse
 * proxy, and traffic that never traverses the proxy is never challenged. That
 * is the same reason an on-box dependent needs no key (see the README).
 *
 * The image ships no authentication of its own, so anything that reaches port
 * 8080 has full control of the linked account. Nothing here should ever be
 * exposed outward — these helpers are for actions running inside the package.
 */

const REQUEST_TIMEOUT_MS = 15_000

/** `http://<container-ip>:8080<path>` for the running container. */
async function containerUrl(effects: T.Effects, path: string): Promise<string> {
  const ip = await effects.getContainerIp({})
  return `http://${ip}:${port}${path}`
}

/**
 * The image wraps failures as `{"error": "..."}`. Show just the message when it
 * does — the JSON envelope tells the operator nothing.
 */
function errorDetail(text: string): string {
  try {
    const parsed = JSON.parse(text) as { error?: string }
    if (parsed.error) return parsed.error.trim()
  } catch {
    // Not JSON — the raw text is already the best we have.
  }
  return text.slice(0, 500)
}

/** GET a JSON endpoint. Throws on a non-2xx with the image's own error text. */
async function signalGet<R>(effects: T.Effects, path: string): Promise<R> {
  const url = await containerUrl(effects, path)

  let res: Response
  try {
    res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (err) {
    throw new Error(
      `Could not reach the Signal API at ${url}: ${(err as Error).message}`,
    )
  }

  const body = await res.text()
  if (!res.ok) {
    throw new Error(`Signal API returned ${res.status}: ${errorDetail(body)}`)
  }

  try {
    return JSON.parse(body) as R
  } catch {
    throw new Error(
      `Signal API returned a non-JSON body (${res.status}): ${body.slice(0, 300)}`,
    )
  }
}

/**
 * PUT a JSON body to an endpoint that answers `204` with no content.
 */
async function signalPut(
  effects: T.Effects,
  path: string,
  body: unknown,
): Promise<void> {
  const url = await containerUrl(effects, path)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (err) {
    throw new Error(
      `Could not reach the Signal API at ${url}: ${(err as Error).message}`,
    )
  }

  if (!res.ok) {
    throw new Error(
      `Signal API returned ${res.status}: ${errorDetail(await res.text())}`,
    )
  }
}

/**
 * The E.164 numbers this service is registered or linked to.
 *
 * `GET /v1/accounts` answers with a bare array of strings. An empty array is
 * the normal state before anything is linked, not an error.
 */
export function listAccounts(effects: T.Effects): Promise<string[]> {
  return signalGet<string[]>(effects, '/v1/accounts')
}

/** One entry of `GET /v1/devices/{number}`. */
export interface LinkedDevice {
  id: number
  name: string
  created: number
  lastSeen: number
}

/**
 * The devices Signal has linked to an account, this service among them.
 *
 * Works from a secondary device, so the service can show the account's whole
 * device list rather than just itself. Device 1 is the primary and reports an
 * empty name — Signal never names it.
 *
 * Removing an entry is not possible from here: `DELETE /v1/devices/{number}/
 * {deviceId}` acts "from the primary account", so unlinking is done in Signal
 * on the phone.
 */
export async function listDevices(
  effects: T.Effects,
  account: string,
): Promise<LinkedDevice[]> {
  const raw = await signalGet<
    {
      id: number
      name?: string
      creation_timestamp?: number
      last_seen_timestamp?: number
    }[]
  >(effects, `/v1/devices/${encodeURIComponent(account)}`)

  return raw.map((d) => ({
    id: d.id,
    name: d.name?.trim() ?? '',
    created: d.creation_timestamp ?? 0,
    lastSeen: d.last_seen_timestamp ?? 0,
  }))
}

/** `GET /v1/about` — versions, build, the running MODE, and per-endpoint features. */
export interface AboutInfo {
  version: string
  build: number
  mode: string
  versions: string[]
  /** Endpoint → optional features, e.g. `{"v2/send": ["quotes", "mentions"]}`. */
  capabilities?: Record<string, string[]>
}

export function about(effects: T.Effects): Promise<AboutInfo> {
  return signalGet<AboutInfo>(effects, '/v1/about')
}

/** One entry of `GET /v1/identities/{number}`. */
export interface Identity {
  /** The contact's E.164 number. Absent for a contact known only by UUID. */
  number: string
  uuid: string
  /** signal-cli's trust level: TRUSTED_UNVERIFIED / TRUSTED_VERIFIED / UNTRUSTED. */
  status: string
  fingerprint: string
  /** The 60-digit number both sides compare to verify the key. */
  safetyNumber: string
  /** Milliseconds since the epoch, as a string in the API's response. */
  added: string
}

/**
 * The contact identities signal-cli knows for an account, and how far each is
 * trusted.
 *
 * An identity appears once messages have been exchanged, so this is empty on a
 * freshly linked account. Available in json-rpc mode (it maps to the daemon's
 * `listIdentities` call), unlike the trust-*mode* endpoint.
 */
export async function listIdentities(
  effects: T.Effects,
  account: string,
): Promise<Identity[]> {
  const raw = await signalGet<
    {
      number?: string
      uuid?: string
      status?: string
      fingerprint?: string
      safety_number?: string
      added?: string
    }[]
  >(effects, `/v1/identities/${encodeURIComponent(account)}`)

  return raw.map((i) => ({
    number: i.number ?? '',
    uuid: i.uuid ?? '',
    status: i.status ?? '',
    fingerprint: i.fingerprint ?? '',
    safetyNumber: i.safety_number ?? '',
    added: i.added ?? '',
  }))
}

/**
 * Mark a contact's key trusted.
 *
 * The API accepts exactly one of the two arguments and rejects the request
 * outright if both or neither are given, so this takes a discriminated choice
 * rather than two optional fields.
 *
 * With a safety number, signal-cli compares it against the key it actually
 * holds and fails if they differ — which is what makes the verification real
 * and a mistyped or stale number a loud error rather than a silent bad trust.
 */
export async function trustIdentity(
  effects: T.Effects,
  account: string,
  contact: string,
  how: { verifiedSafetyNumber: string } | { allKnownKeys: true },
): Promise<void> {
  const body =
    'verifiedSafetyNumber' in how
      ? { verified_safety_number: how.verifiedSafetyNumber }
      : { trust_all_known_keys: true }

  await signalPut(
    effects,
    `/v1/identities/${encodeURIComponent(account)}/trust/${encodeURIComponent(contact)}`,
    body,
  )
}

/**
 * A fresh device-linking URI (`sgnl://linkdevice?uuid=…&pub_key=…`).
 *
 * `/v1/qrcodelink` renders a PNG; the `/raw` variant returns the URI as JSON,
 * which is what lets the action show a copyable link alongside a QR code.
 *
 * The URI is a credential: whoever redeems it becomes a linked device on the
 * account, able to read and send. Signal issues a different one per request.
 */
export async function deviceLinkUri(
  effects: T.Effects,
  deviceName: string,
): Promise<string> {
  const query = new URLSearchParams({ device_name: deviceName })
  const res = await signalGet<{ device_link_uri?: string }>(
    effects,
    `/v1/qrcodelink/raw?${query}`,
  )
  const uri = res.device_link_uri?.trim()
  if (!uri) {
    throw new Error('The Signal API returned no device link.')
  }
  return uri
}
