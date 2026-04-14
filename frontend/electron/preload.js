/**
 * MakeHuman 2 - Electron Preload Script
 *
 * Runs in the renderer context but with access to Node's contextBridge.
 * Exposes a safe `window.mh` API that the React/Next.js UI can call.
 */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mh", {
  /**
   * Ping the MakeHuman 2 Python core and get app/character name.
   * @param {{ host?: string, port?: number }} [opts]
   * @returns {Promise<{ ok: boolean, data?: { application: string, name: string }, error?: string }>}
   */
  hello: (opts) => ipcRenderer.invoke("mh:hello", opts),

  /**
   * Get the current character JSON (mesh/skeleton info).
   * @param {{ host?: string, port?: number, scale?: number, onground?: boolean, hidden?: boolean, anim?: boolean }} [opts]
   * @returns {Promise<{ ok: boolean, data?: object, error?: string }>}
   */
  getChar: (opts) => ipcRenderer.invoke("mh:getchar", opts),

  /**
   * Randomize the character in the core application.
   * @param {{ host?: string, port?: number, mode?: number }} [opts]
   * @returns {Promise<{ ok: boolean, data?: object, error?: string }>}
   */
  randomize: (opts) => ipcRenderer.invoke("mh:randomize", opts),

  /**
   * Fetch binary mesh buffers (must call getChar first in the same session).
   * @param {{ host?: string, port?: number }} [opts]
   * @returns {Promise<{ ok: boolean, byteLength?: number, error?: string }>}
   */
  getBinaryChar: (opts) => ipcRenderer.invoke("mh:bin_getchar", opts),
});
