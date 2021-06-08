import { BrowserWindow } from 'electron'
import EventEmitter from 'events'
import { GuestWebPreferences } from 'WebContentsManager'
import WaveboxWindow from 'Windows/WaveboxWindow'
import { WINDOW_BACKING_TYPES } from 'Windows/WindowBackingTypes'
import WindowOpeningHandler from 'Windows/WindowOpeningEngine/WindowOpeningHandler'

const privWindow = Symbol('privWindow')
const privWindowResizeInterval = Symbol('privWindowResizeInterval')
const privOpeningTabId = Symbol('privOpeningTabId')
const privExtension = Symbol('privExtension')

// The max-mins are a bit of a guess
const MAX_WIDTH = 780
const MAX_HEIGHT = 580
const MIN_WIDTH = 320
const MIN_HEIGHT = 100

class CRExtensionPopupWindow extends EventEmitter {
  /* ****************************************************************************/
  // Lifecycle
  /* ****************************************************************************/

  /**
  * Starts the popup window
  * @param openingTabId: the id of the opening tab
  * @param bgWindowOptions: the configuration for the window directly from the
  * background window
  */
  constructor (openingTabId, bgWindowOptions, extension) {
    super()

    this[privWindowResizeInterval] = null
    this[privOpeningTabId] = openingTabId
    this[privExtension] = extension
    this[privWindow] = new BrowserWindow(this._getWindowOptions(openingTabId, bgWindowOptions))

    // Listen to window events
    this[privWindow].on('blur', this.handleBlur)
    this[privWindow].on('show', this.handleShow)
    this[privWindow].on('closed', this.handleClosed)

    // Listen to webcontents events
    this[privWindow].webContents.on('new-window', this.handleWebContentsNewWindow)
    this[privWindow].webContents.on('dom-ready', this.handleWebContentsDomReady)

    // Call show after init so we get the show event
    this[privWindow].show()
  }

  destroy () {
    if (this[privWindow] && !this[privWindow].isDestroyed()) {
      this[privWindow].destroy()
    }
    clearInterval(this[privWindowResizeInterval])
    this[privWindow] = undefined
  }

  /* ****************************************************************************/
  // Properties
  /* ****************************************************************************/

  get window () { return this[privWindow] }

  /* ****************************************************************************/
  // Helpers
  /* ****************************************************************************/

  /**
  * Get the window options
  * @param openingTabId: the id of the opening tab
  * @param bgWindowOptions: the background window options
  * @return options to pass to browser window
  */
  _getWindowOptions (openingTabId, bgWindowOptions) {
    // Sanitize web preferences
    if (!bgWindowOptions.webPreferences) {
      bgWindowOptions.webPreferences = {}
    }
    GuestWebPreferences.sanitizeForGuestUse(bgWindowOptions.webPreferences)

    // Setup the window
    return {
      ...bgWindowOptions,
      backgroundColor: '#FFFFFF',
      frame: false,
      resizable: false,
      focusable: true,
      skipTaskbar: true,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      alwaysOnTop: true,
      useContentSize: true,
      center: true,
      maxWidth: MAX_WIDTH,
      maxHeight: MAX_HEIGHT,
      minWidth: MIN_WIDTH,
      minHeight: MIN_HEIGHT,
      show: false, // Call show after init so we get the show event
      ...(this._getPositioningInfo(openingTabId, MIN_WIDTH, MIN_HEIGHT) || { width: MIN_WIDTH, height: MIN_HEIGHT })
    }
  }

  /**
  * Gets the positioning info
  * @param openingTabId: the id of the original tab
  * @param width: the width of the popup
  * @param height: the height of the popup
  * @return positioning info or undefined
  */
  _getPositioningInfo (openingTabId, width, height) {
    const wbWindow = WaveboxWindow.fromTabId(openingTabId)
    if (wbWindow) {
      const bounds = wbWindow.getContentBounds()
      width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width))
      height = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, height))
      return {
        width: width,
        height: height,
        x: (bounds.x + bounds.width) - width,
        y: bounds.y + 40
      }
    } else {
      return undefined
    }
  }

  /* ****************************************************************************/
  // Window events
  /* ****************************************************************************/

  /**
  * Hanldes the window showing
  * @param evt: the event that fired
  */
  handleShow = (evt) => {
    clearInterval(this[privWindowResizeInterval])
    this[privWindowResizeInterval] = setInterval(this.autoResizeWindow, 500)

    this.emit('show', evt)
  }

  /**
  * Handles the window closing
  * @param evt: the event that fired
  */
  handleClosed = (evt) => {
    this.destroy()
    this.emit('closed', evt)
  }

  /**
  * Handles the window bluring
  * @param evt: the event that fired
  */
  handleBlur = (evt) => {
    if (this[privWindow].webContents.isDevToolsOpened()) {
      return
    }
    this[privWindow].close()
  }

  /**
  * Automatically resizes the window by looking at the size of the html element
  */
  autoResizeWindow = () => {
    this[privWindow].webContents.executeJavaScript([
      `document && document.documentElement ? document.documentElement.style.backgroundColor = '#FFFFFF' : undefined`, // Patch for https://github.com/electron/electron/issues/12211
      `document.head && document.head.parentElement ? [document.head.parentElement.offsetWidth, document.head.parentElement.offsetHeight] : undefined`
    ].join(';'))
      .then((size) => {
        if (size) {
          if (this[privWindow] && !this[privWindow].isDestroyed()) {
            const bounds = this._getPositioningInfo(this[privOpeningTabId], size[0], size[1])
            if (bounds) {
              if (process.platform === 'darwin') {
                this[privWindow].setBounds(bounds, true)
              } else {
                this[privWindow].setBounds(bounds) // win32 & linux bork if you pass a second arg
              }
            } else {
              this[privWindow].setSize(size[0], size[1])
              this[privWindow].center()
            }
          }
        }
      })
  }

  /* ****************************************************************************/
  // Webcontents events
  /* ****************************************************************************/

  /**
  * Handles the webcontents requesting a new window
  * @param evt: the event that fired
  * @param targetUrl: the webview url
  * @param frameName: the name of the frame
  * @param disposition: the frame disposition
  * @param options: the browser window options
  * @param additionalFeatures: The non-standard features
  */
  handleWebContentsNewWindow = (evt, targetUrl, frameName, disposition, options, additionalFeatures) => {
    WindowOpeningHandler.handleOpenNewWindow(evt, {
      targetUrl: targetUrl,
      frameName: frameName,
      disposition: disposition,
      options: options,
      additionalFeatures: additionalFeatures,
      openingBrowserWindow: this.window,
      openingWindowType: this.windowType,
      tabMetaInfo: {
        backing: WINDOW_BACKING_TYPES.EXTENSION,
        extensionId: this[privExtension].id,
        extensionName: this[privExtension].manifest.name
      },
      provisionalTargetUrl: undefined
    })
  }

  /**
  * Handles the dom being ready
  * @param evt: the event that fired
  */
  handleWebContentsDomReady = (evt) => {
    // A bad hack to disable the context-menu
    this[privWindow].webContents.removeAllListeners('context-menu')
  }
}

export default CRExtensionPopupWindow
