import {
  CR_RUNTIME_ENVIRONMENTS
} from 'shared/extensionApis'
import { protectedJSWindowTracker } from 'Runtime/ProtectedRuntimeSymbols'
import { ipcRenderer } from 'electronCrx'
import { CRX_GET_WEBCONTENT_META_SYNC_ } from 'shared/crExtensionIpcEvents'

const privRuntime = Symbol('privRuntime')
const privExtensionId = Symbol('privExtensionId')
const privRuntimeEnvironment = Symbol('privRuntimeEnvironment')

class Extension {
  /* **************************************************************************/
  // Lifecycle
  /* **************************************************************************/

  /**
  * https://developer.chrome.com/extensions/extension
  * @param extensionId: the id of the extension
  * @param runtimeEnvironment: the current runtime environment
  * @param runtime: the runtime object we proxy some requests through for
  */
  constructor (extensionId, runtimeEnvironment, runtime) {
    this[privExtensionId] = extensionId
    this[privRuntimeEnvironment] = runtimeEnvironment
    this[privRuntime] = runtime
    Object.freeze(this)
  }

  /* **************************************************************************/
  // Properties: Pass through
  /* **************************************************************************/

  get onMessage () { return this[privRuntime].onMessage }
  get onRequest () { return this[privRuntime].onMessage }
  get sendMessage () { return this[privRuntime].sendMessage.bind(this[privRuntime]) }
  get getURL () { return this[privRuntime].getURL.bind(this[privRuntime]) }
  get connect () { return this[privRuntime].connect.bind(this[privRuntime]) }
  get getBackgroundPage () {
    if (this[privRuntimeEnvironment] === CR_RUNTIME_ENVIRONMENTS.BACKGROUND) {
      return () => { return window }
    } else if (this[privRuntimeEnvironment] === CR_RUNTIME_ENVIRONMENTS.HOSTED) {
      return () => { return window.opener }
    } else {
      return undefined
    }
  }

  /* **************************************************************************/
  // Getters
  /* **************************************************************************/

  get getViews () {
    if (this[privRuntimeEnvironment] === CR_RUNTIME_ENVIRONMENTS.BACKGROUND) {
      return (fetchProperties) => {
        fetchProperties = fetchProperties || {}
        const all = this[privRuntime][protectedJSWindowTracker].allArray()

        if (Object.keys(fetchProperties).length) {
          const { allMeta, unknownIds } = all.reduce((acc, { wcId, viewType }) => {
            if (viewType === 'popup') {
              acc.allMeta.set(wcId, { type: 'popup' })
            } else {
              acc.unknownIds.push(wcId)
            }
            return acc
          }, { allMeta: new Map(), unknownIds: [] })
          if (unknownIds.length) {
            const extMeta = ipcRenderer.sendSync(`${CRX_GET_WEBCONTENT_META_SYNC_}${this[privExtensionId]}`, unknownIds)
            extMeta.forEach((d) => { allMeta.set(d.id, d) })
          }

          const filtered = all
            .filter(({ wcId, window }) => {
              const meta = allMeta.get(wcId) || {}
              if (fetchProperties.windowId !== undefined && fetchProperties.windowId !== meta.windowId) {
                return false
              }
              if (fetchProperties.tabId !== undefined && fetchProperties.tabId !== wcId) {
                return false
              }
              if (fetchProperties.type && fetchProperties.type !== meta.viewType) {
                return false
              }

              return true
            })
            .map(({ window }) => window)
          return filtered
        } else {
          return all.map(({ window }) => window)
        }
      }
    } else {
      return undefined
    }
  }

  /* **************************************************************************/
  // Methods
  /* **************************************************************************/

  isAllowedIncognitoAccess (callback) {
    const res = false
    setTimeout(() => callback(res))
  }

  sendRequest (...args) {
    return this[privRuntime].sendMessage(...args)
  }
}

export default Extension
