import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  selectVault: (): Promise<string | null> => ipcRenderer.invoke('dialog:openDirectory'),
  getFiles: (path: string): Promise<string[]> => ipcRenderer.invoke('vault:getFiles', path),
  readFile: (path: string): Promise<string> => ipcRenderer.invoke('vault:readFile', path),
  saveFile: (path: string, content: string): Promise<boolean> => ipcRenderer.invoke('vault:saveFile', path, content),
  createNote: (dir: string, filename: string): Promise<string> => ipcRenderer.invoke('vault:createNote', dir, filename),
  renameNote: (oldPath: string, newPath: string): Promise<boolean> => ipcRenderer.invoke('vault:renameNote', oldPath, newPath),
  deleteNote: (path: string): Promise<boolean> => ipcRenderer.invoke('vault:deleteNote', path),
  search: (dir: string, query: string): Promise<any[]> => ipcRenderer.invoke('vault:search', dir, query),
  saveState: (state: any) => ipcRenderer.invoke('vault:saveState', state),
  loadState: () => ipcRenderer.invoke('vault:loadState'),
  getIndex: (path: string): Promise<any> => ipcRenderer.invoke('vault:getIndex', path),
  getVaultUrl: (vaultPath: string, filename: string): Promise<string> => ipcRenderer.invoke('vault:getVaultUrl', vaultPath, filename)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
