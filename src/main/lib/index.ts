import { readdir, stat, readFile, writeFile, rename, unlink } from 'fs/promises'
import { join, extname } from 'path'

export interface SearchResult {
    path: string
    title: string
    score: number
}

export async function getMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = []
    const items = await readdir(dir)

    for (const item of items) {
        if (item.startsWith('.')) continue // Skip dotfiles

        const fullPath = join(dir, item)
        const stats = await stat(fullPath)

        if (stats.isDirectory()) {
            const subFiles = await getMarkdownFiles(fullPath)
            files.push(...subFiles)
        } else if (stats.isFile() && extname(item) === '.md') {
            files.push(fullPath)
        }
    }

    return files
}

export async function readMarkdownFile(path: string): Promise<string> {
    const content = await readFile(path, { encoding: 'utf-8' })
    return content
}

export async function saveMarkdownFile(path: string, content: string): Promise<boolean> {
    try {
        await writeFile(path, content, { encoding: 'utf-8' })
        return true
    } catch (e) {
        console.error('Failed to save file:', e)
        return false
    }
}

export async function createNote(dir: string, filename: string): Promise<string> {
    const fullPath = join(dir, filename)

    try {
        await stat(fullPath)
        // File exists, just return path (don't overwrite)
        return fullPath
    } catch {
        // File doesn't exist, create it
        await writeFile(fullPath, '', { encoding: 'utf-8' })
        return fullPath
    }
}

export async function renameNote(oldPath: string, newPath: string): Promise<boolean> {
    try {
        await rename(oldPath, newPath)
        return true
    } catch (e) {
        console.error('Failed to rename file:', e)
        return false
    }
}

export async function deleteNote(path: string): Promise<boolean> {
    try {
        await unlink(path)
        return true
    } catch (e) {
        console.error('Failed to delete file:', e)
        return false
    }
}

export async function searchNotes(dir: string, query: string): Promise<SearchResult[]> {
    if (!query) return []
    const files = await getMarkdownFiles(dir)
    const results: SearchResult[] = []
    const lowerQuery = query.toLowerCase()

    for (const file of files) {
        const name = file.split(/[/\\]/).pop() || ''
        const lowerName = name.toLowerCase()
        let score = 0

        if (lowerName.includes(lowerQuery)) {
            score += 10 // Filename match priority
        }

        try {
            const content = await readFile(file, { encoding: 'utf-8' })
            if (content.toLowerCase().includes(lowerQuery)) {
                score += 5
            }
        } catch (e) {
            // Ignore read errors
        }

        if (score > 0) {
            results.push({
                path: file,
                title: name,
                score
            })
        }
    }

    return results.sort((a, b) => b.score - a.score)
}

export interface AppState {
    lastVaultPath?: string
    lastActiveFile?: string
}

export async function saveState(configPath: string, state: AppState): Promise<void> {
    try {
        await writeFile(configPath, JSON.stringify(state, null, 2), { encoding: 'utf-8' })
    } catch (e) {
        console.error('Failed to save config:', e)
    }
}

export async function loadState(configPath: string): Promise<AppState> {
    try {
        const content = await readFile(configPath, { encoding: 'utf-8' })
        return JSON.parse(content)
    } catch {
        return {}
    }
}
