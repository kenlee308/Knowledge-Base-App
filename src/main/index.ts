import { app, shell, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { getMarkdownFiles, readMarkdownFile, saveMarkdownFile, createNote, renameNote, deleteNote, searchNotes, saveState, loadState, AppState } from './lib/index'
import { buildVaultIndex } from './lib/indexer'
import icon from '../../resources/icon.png?asset'

// Register vault protocol as privileged
protocol.registerSchemesAsPrivileged([
  { scheme: 'vault', privileges: { secure: true, standard: true, allowServiceWorkers: true, bypassCSP: true } }
])

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.electron')
  }

  // Register Custom Protocol for secure file loading
  protocol.handle('vault', (request) => {
    // request.url is something like vault://C:/path/to/img.png
    let path = request.url.substring(8)
    path = decodeURIComponent(path)

    // Normalize Windows paths: Electron sometimes makes it vault://c/path/
    if (/^[a-zA-Z]\//.test(path)) {
      path = path[0] + ':/' + path.substring(2)
    }

    try {
      // Use pathToFileURL for robust conversion
      const fileUrl = pathToFileURL(path).href
      console.log('[Protocol] Request:', request.url, '->', fileUrl)
      return net.fetch(fileUrl)
    } catch (e) {
      console.error('[Protocol] Error fetching:', path, e)
      return new Response('Not Found', { status: 404 })
    }
  })

  const userDataPath = app.getPath('userData')
  const configPath = join(userDataPath, 'config.json')

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (canceled) {
      return null
    } else {
      return filePaths[0]
    }
  })

  ipcMain.handle('vault:getFiles', async (_, path: string) => {
    return await getMarkdownFiles(path)
  })

  ipcMain.handle('vault:readFile', async (_, path: string) => {
    return await readMarkdownFile(path)
  })

  ipcMain.handle('vault:saveFile', async (_, path: string, content: string) => {
    return await saveMarkdownFile(path, content)
  })

  ipcMain.handle('vault:getIndex', async (_, path: string) => {
    return await buildVaultIndex(path)
  })

  ipcMain.handle('vault:createNote', async (_, dir: string, filename: string) => {
    return await createNote(dir, filename)
  })

  ipcMain.handle('vault:renameNote', async (_, oldPath: string, newPath: string) => {
    return await renameNote(oldPath, newPath)
  })

  ipcMain.handle('vault:deleteNote', async (_, path: string) => {
    return await deleteNote(path)
  })

  ipcMain.handle('vault:search', async (_, dir: string, query: string) => {
    return await searchNotes(dir, query)
  })

  ipcMain.handle('vault:saveState', async (_, state: AppState) => {
    return await saveState(configPath, state)
  })

  ipcMain.handle('vault:loadState', async () => {
    return await loadState(configPath)
  })

  ipcMain.handle('vault:getVaultUrl', async (_, vaultPath: string, filename: string) => {
    // Construct a safe vault:// URL
    const fullPath = join(vaultPath, filename)
    // Return formatted for vault protocol: vault://C:/path...
    // We normalize slashes to prevent issues with the URL constructor/parser
    return `vault://${fullPath.replace(/\\/g, '/')}`
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
