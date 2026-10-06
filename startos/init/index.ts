import { sdk } from '../sdk'
import { restoreInit } from '../backups'
import { versionGraph } from '../versions'
import { setInterfaces } from '../interfaces'
import { actions } from '../actions'
import { dependencies } from '../dependencies'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  setInterfaces,
  actions,
  dependencies,
)

export const uninit = sdk.setupUninit(versionGraph)
