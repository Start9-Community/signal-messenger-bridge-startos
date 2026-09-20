import { sdk } from '../sdk'
import { restoreInit } from '../backups'
import { versionGraph } from '../versions'
import { setInterfaces } from '../interfaces'
import { actions } from '../actions'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  setInterfaces,
  actions,
)

export const uninit = sdk.setupUninit(versionGraph)
