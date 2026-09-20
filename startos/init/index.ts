import { sdk } from '../sdk'
import { restoreInit } from '../backups'
import { versionGraph } from '../versions'
import { setInterfaces } from '../interfaces'
import { actions } from '../actions'
import { seedApiKeys } from './seedApiKeys'

/**
 * Argument order is run order, and it is load-bearing: restored data must be on
 * disk before anything reads it, migrations run before the code that assumes
 * the current shape, and the API key must be seeded before `setInterfaces`
 * binds the port — otherwise the first bind has an empty token set.
 */
export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  seedApiKeys,
  setInterfaces,
  actions,
)

export const uninit = sdk.setupUninit(versionGraph)
