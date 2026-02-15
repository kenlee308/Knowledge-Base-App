import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      selectVault: () => Promise<string | null>
      getFiles: (path: string) => Promise<string[]>
      readFile: (path: string) => Promise<string>
      saveFile: (path: string, content: string) => Promise<boolean>
      createNote: (dir: string, filename: string) => Promise<string>
      renameNote: (oldPath: string, newPath: string) => Promise<boolean>
      deleteNote: (path: string) => Promise<boolean>
      search: (dir: string, query: string) => Promise<any[]>
      saveState: (state: { lastVaultPath?: string, lastActiveFile?: string }) => Promise<void>
      loadState: () => Promise<{ lastVaultPath?: string, lastActiveFile?: string }>
      getIndex: (path: string) => Promise<any>
      getVaultUrl: (vaultPath: string, filename: string) => Promise<string>
    }
  }
}
