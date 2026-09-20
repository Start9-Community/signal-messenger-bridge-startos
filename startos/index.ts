import { buildManifest } from '@start9labs/start-sdk'
import { manifest as sdkManifest } from './manifest'
import { versionGraph } from './versions'

/**
 * Plumbing. DO NOT EDIT.
 */
export const manifest = buildManifest(versionGraph, sdkManifest)

export { createBackup } from './backups'
export { main } from './main'
export { init, uninit } from './init'
// Required: wiring `actions` into setupInit only exports each action's metadata
// (so it lists in the UI). The host resolves the input spec through this export
// when the action is opened — without it, opening any action fails host-side.
export { actions } from './actions'
