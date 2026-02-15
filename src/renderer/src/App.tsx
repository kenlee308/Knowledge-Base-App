import React from 'react'
import Versions from './components/Versions'
import { FileNode, buildFileTree } from './components/FileExplorer/utils'
import { FileTree } from './components/FileExplorer/FileTree'
import { Editor } from './components/Editor'
import { BacklinksPane } from './components/BacklinksPane'
import { GraphView } from './components/GraphView'
import { CommandPalette } from './components/CommandPalette'
import { TagExplorer } from './components/TagExplorer'

function App(): React.JSX.Element {
  const [vaultPath, setVaultPath] = React.useState<string | null>(null)
  const [fileTree, setFileTree] = React.useState<FileNode[]>([])
  const [activeFile, setActiveFile] = React.useState<string | null>(null)
  const [fileContent, setFileContent] = React.useState<string>('')
  const [unsavedChanges, setUnsavedChanges] = React.useState<boolean>(false)
  const [vaultIndex, setVaultIndex] = React.useState<any>(null)
  const [viewMode, setViewMode] = React.useState<'editor' | 'graph'>('editor')
  const [searchQuery, setSearchQuery] = React.useState<string>('')
  const [searchResults, setSearchResults] = React.useState<any[]>([])
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false)
  const [statusBarText, setStatusBarText] = React.useState('Ready')

  // Persistence: Load State on Mount
  React.useEffect(() => {
    const init = async () => {
      const state = await window.api.loadState()
      if (state.lastVaultPath) {
        setVaultPath(state.lastVaultPath)
        const files = await window.api.getFiles(state.lastVaultPath)
        const tree = buildFileTree(state.lastVaultPath, files)
        setFileTree(tree)

        // Fix: Load index on startup too!
        const index = await window.api.getIndex(state.lastVaultPath)
        setVaultIndex(index)

        if (state.lastActiveFile) {
          // Verify file still exists
          try {
            // We can just try to select it. If readFile fails, handleSelectFile might need to be robust.
            // Or we check if it is in the file list.
            // Simple check:
            await window.api.readFile(state.lastActiveFile)
            handleSelectFile(state.lastActiveFile)
          } catch {
            // File might have been deleted outside app
            console.log('Last active file not found')
          }
        }
      }
    }
    init()
  }, [])

  // Persistence: Save State on Change
  React.useEffect(() => {
    if (vaultPath) {
      window.api.saveState({
        lastVaultPath: vaultPath,
        lastActiveFile: activeFile || undefined
      })
    }
  }, [vaultPath, activeFile])

  // Command Palette Toggle
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        setIsCommandPaletteOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Search Effect
  React.useEffect(() => {
    if (!vaultPath || !searchQuery) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const results = await window.api.search(vaultPath, searchQuery)
        setSearchResults(results)
      } catch (e) {
        console.error(e)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, vaultPath])

  const handleOpenVault = async (): Promise<void> => {
    const path = await window.api.selectVault()
    if (path) {
      setVaultPath(path)
      const files = await window.api.getFiles(path)
      const tree = buildFileTree(path, files)
      setFileTree(tree)

      const index = await window.api.getIndex(path)
      console.log('Vault Index:', index)
      setVaultIndex(index)
    }
  }

  const handleSelectFile = async (path: string): Promise<void> => {
    // If unsaved changes, maybe prompt? For now, we just switch and lose changes or auto-save?
    // Let's safe-guard by force saving or just ignoring for now (Simplicity first)
    // Better: Auto-save on switch if unsaved.
    if (activeFile && unsavedChanges) {
      console.log('Switching file, saving previous:', activeFile)
      await window.api.saveFile(activeFile, fileContent)
    }

    setActiveFile(path)
    setViewMode('editor') // Switch back to editor when file selected
    try {
      const content = await window.api.readFile(path)
      setFileContent(content)
      setUnsavedChanges(false)
    } catch (err) {
      console.error('Failed to read file', err)
      setFileContent('Error reading file')
    }
  }

  const handleEditorChange = (newContent: string): void => {
    setFileContent(newContent)
    setUnsavedChanges(true)
  }

  // Debounced Save
  React.useEffect(() => {
    if (!activeFile || !unsavedChanges) return

    const timer = setTimeout(async () => {
      console.log('Auto-saving:', activeFile)
      await window.api.saveFile(activeFile, fileContent)
      setUnsavedChanges(false)
    }, 1000)

    return (): void => clearTimeout(timer)
  }, [fileContent, activeFile, unsavedChanges])

  const handleCreateNote = async (): Promise<void> => {
    if (!vaultPath) return

    // Fallback: Auto-generate name to avoid window.prompt issues in Electron
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const name = `Untitled ${timestamp}.md`

    try {
      const newPath = await window.api.createNote(vaultPath, name)

      // Refresh files
      const files = await window.api.getFiles(vaultPath)
      const tree = buildFileTree(vaultPath, files)
      setFileTree(tree)

      // Select new file
      handleSelectFile(newPath)
    } catch (err) {
      console.error('Failed to create note:', err)
    }
  }

  // Helper for Daily Note
  const handleOpenDailyNote = async () => {
    if (!vaultPath) return
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const filename = `${year}-${month}-${day}.md`
    try {
      const path = await window.api.createNote(vaultPath, filename)
      const files = await window.api.getFiles(vaultPath!)
      const tree = buildFileTree(vaultPath!, files)
      setFileTree(tree)
      handleSelectFile(path)
    } catch (err) { console.error(err) }
  }

  // Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()

      if (isMod && key === 'n') {
        e.preventDefault()
        handleCreateNote()
        setIsCommandPaletteOpen(false)
      }
      if (isMod && key === 'd' && e.shiftKey) {
        e.preventDefault()
        handleOpenDailyNote()
        setIsCommandPaletteOpen(false)
      }
      if (isMod && key === 'g') {
        setViewMode('graph')
        setIsCommandPaletteOpen(false)
      }
      if (isMod && key === 'e') {
        setViewMode('editor')
        setIsCommandPaletteOpen(false)
      }
      if (isMod && key === 'o') {
        handleOpenVault()
        setIsCommandPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [vaultPath, handleCreateNote, handleOpenDailyNote /* Recreated each render, slightly inefficient but safe */])

  // Commands Definition
  const commands = [
    { id: 'new-note', name: 'Create New Note', shortcut: 'Ctrl+N', action: () => handleCreateNote() },
    { id: 'daily-note', name: 'Open Daily Note', shortcut: 'Ctrl+Shift+D', action: handleOpenDailyNote },
    { id: 'graph-view', name: 'Switch to Graph View', shortcut: 'Ctrl+G', action: () => setViewMode('graph') },
    { id: 'editor-view', name: 'Switch to Editor View', shortcut: 'Ctrl+E', action: () => setViewMode('editor') },
    { id: 'open-vault', name: 'Open Vault', shortcut: 'Ctrl+O', action: handleOpenVault },
  ]

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {!vaultPath ? (
        <div className="setup" style={{ padding: '20px', flex: 1 }}>
          <h1>Knowledge Base</h1>
          <p>Select a folder to use as your Vault.</p>
          <button onClick={handleOpenVault} style={{ marginTop: '20px' }}>Open Vault</button>
          <div style={{ marginTop: 'auto', padding: '20px' }}><Versions /></div>
        </div>
      ) : (
        <div className="workspace" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            commands={commands}
          />
          <div className="sidebar" style={{ width: '250px', background: '#1e1e1e', overflowY: 'auto', borderRight: '1px solid #333' }}>
            <div className="sidebar-header" style={{ padding: '10px', color: '#888', textTransform: 'uppercase', fontSize: '0.8em', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span>Files</span>
                <div>
                  <button
                    onClick={() => setViewMode(viewMode === 'editor' ? 'graph' : 'editor')}
                    style={{ background: 'none', border: 'none', color: viewMode === 'graph' ? '#a277ff' : '#ccc', cursor: 'pointer', fontSize: '1.2em', marginRight: '5px' }}
                    title="Toggle Graph View"
                  >
                    🕸️
                  </button>
                  <button
                    onClick={async () => {
                      if (!vaultPath) return
                      const date = new Date()
                      const year = date.getFullYear()
                      const month = String(date.getMonth() + 1).padStart(2, '0')
                      const day = String(date.getDate()).padStart(2, '0')
                      const filename = `${year}-${month}-${day}.md`

                      try {
                        const path = await window.api.createNote(vaultPath, filename)

                        // Refresh
                        const files = await window.api.getFiles(vaultPath!)
                        const tree = buildFileTree(vaultPath!, files)
                        setFileTree(tree)

                        handleSelectFile(path)
                      } catch (err) {
                        console.error(err)
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '1.2em', marginRight: '5px' }}
                    title="Open Daily Note"
                  >
                    📅
                  </button>
                  <button
                    onClick={() => setIsCommandPaletteOpen(true)}
                    style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '1.2em', marginRight: '5px' }}
                    title="Open Command Palette (Ctrl+P)"
                  >
                    ⌨️
                  </button>
                  <button
                    onClick={handleCreateNote}
                    style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '1.2em' }}
                    title="New Note"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="Search vault..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: '#fff' }}
              />
            </div>

            {searchQuery ? (
              <div className="search-results">
                {searchResults.map(result => (
                  <div
                    key={result.path}
                    onClick={() => handleSelectFile(result.path)}
                    style={{
                      padding: '5px 10px',
                      cursor: 'pointer',
                      background: activeFile === result.path ? '#333' : 'transparent',
                      color: activeFile === result.path ? '#fff' : '#aaa',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {result.title}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <FileTree nodes={fileTree} onSelect={handleSelectFile} />
                <TagExplorer
                  index={vaultIndex}
                  onTagClick={(tag) => {
                    setSearchQuery(`#${tag}`)
                    setViewMode('editor')
                  }}
                />
              </>
            )}
          </div>
          <div className="main-content" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {viewMode === 'graph' ? (
              <GraphView index={vaultIndex} onNodeClick={handleSelectFile} />
            ) : activeFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="editor-header" style={{ padding: '5px 20px', borderBottom: '1px solid #333', background: '#222', fontSize: '0.9em', display: 'flex', alignItems: 'center' }}>
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={async (e) => {
                      const newName = e.currentTarget.textContent
                      if (newName && newName !== activeFile.split(/[/\\]/).pop()) {
                        // const dir = activeFile.substring(0, activeFile.lastIndexOf('\\'))
                        const oldPath = activeFile
                        // const newPath = `${dir}\\${newName}`
                        // Better: use window.api.path.join if exposed, or simple string manip if consistent.

                        // Actually, let's keep it simple. We need the full new path.
                        // Since we don't have path.join in renderer easily without exposing it,
                        // let's try to construct it carefully.

                        // Hacky path join for now
                        const separator = activeFile.includes('/') ? '/' : '\\'
                        const parentDir = activeFile.substring(0, activeFile.lastIndexOf(separator))
                        const finalNewPath = `${parentDir}${separator}${newName}`

                        try {
                          console.log('Renaming', oldPath, 'to', finalNewPath)
                          await window.api.renameNote(oldPath, finalNewPath)

                          // Refresh
                          const files = await window.api.getFiles(vaultPath!)
                          const tree = buildFileTree(vaultPath!, files)
                          setFileTree(tree)
                          setActiveFile(finalNewPath)
                        } catch (err) {
                          console.error('Rename failed', err)
                          e.currentTarget.textContent = activeFile.split(/[/\\]/).pop() || '' // Revert
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        e.currentTarget.blur()
                      }
                    }}
                    style={{ fontWeight: 'bold', cursor: 'text', minWidth: '50px', outline: 'none' }}
                  >
                    {activeFile.split(/[/\\]/).pop()}
                  </span>
                  {unsavedChanges && <span style={{ marginLeft: '10px', color: 'orange', fontSize: '1.2em', lineHeight: 0.5 }}>•</span>}

                  <button
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete "${activeFile.split(/[/\\]/).pop()}"?`)) {
                        await window.api.deleteNote(activeFile)

                        // Refresh
                        const files = await window.api.getFiles(vaultPath!)
                        const tree = buildFileTree(vaultPath!, files)
                        setFileTree(tree)
                        setActiveFile(null)
                        setFileContent('')
                      }
                    }}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '1.2em' }}
                    title="Delete Note"
                  >
                    🗑️
                  </button>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <Editor
                    key={activeFile} // Force re-mount on file change to reset internal state
                    initialContent={fileContent}
                    onChange={handleEditorChange}
                    onNavigate={async (link) => {
                      if (!vaultPath) return
                      console.log('Navigating to:', link)

                      // Normalize link: remove duplicate brackets if any (though regex handles it)
                      const cleanLink = link.replace(/[\[\]]/g, '')
                      const safeName = cleanLink.endsWith('.md') ? cleanLink : `${cleanLink}.md`

                      // Check if exists in tree
                      // Flatten tree for easier search? Or just use API.
                      // Using API is robust.

                      try {
                        const exists = await window.api.createNote(vaultPath, safeName) // createNote checks existence now!
                        // Wait, createNote creates if missing.
                        // That matches "click to create" behavior.

                        // Refresh
                        const files = await window.api.getFiles(vaultPath)
                        const tree = buildFileTree(vaultPath, files)
                        setFileTree(tree)

                        handleSelectFile(exists)
                      } catch (e) {
                        console.error(e)
                      }
                    }}
                    onHover={(link) => {
                      if (link) {
                        setStatusBarText(`Link: [[${link}]] (Ctrl + Click to follow)`)
                      } else {
                        setStatusBarText('Ready')
                      }
                    }}
                    vaultPath={vaultPath}
                  />
                </div>
                {/* Status Bar */}
                <div style={{ padding: '2px 10px', background: '#007acc', color: 'white', fontSize: '0.8em', display: 'flex', alignItems: 'center' }}>
                  <span>{statusBarText}</span>
                </div>
              </div>
            ) : (
              <div style={{ opacity: 0.5, marginTop: '20vh', textAlign: 'center' }}>
                <p>Select a note to view</p>
              </div>
            )}
          </div>
          <div className="sidebar-right" style={{ width: '250px', background: '#1e1e1e', borderLeft: '1px solid #333', overflowY: 'auto' }}>
            <BacklinksPane currentFile={activeFile} index={vaultIndex} onSelect={handleSelectFile} />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
