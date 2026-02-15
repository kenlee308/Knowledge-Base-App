import { getMarkdownFiles, readMarkdownFile } from './index'
import { parseMarkdown } from './parser'
import { basename, extname } from 'path'

export interface FileIndexEntry {
    title: string
    tags: string[]
    links: string[]     // Outgoing link targets (raw)
    backlinks: string[] // Paths of files linking TO this file
}

export type VaultIndex = Record<string, FileIndexEntry> // Key: absolute path

export async function buildVaultIndex(vaultPath: string): Promise<VaultIndex> {
    const filePaths = await getMarkdownFiles(vaultPath)
    const index: VaultIndex = {}

    // 1. Parse all files
    for (const path of filePaths) {
        try {
            const content = await readMarkdownFile(path)
            const metadata = parseMarkdown(content)

            index[path] = {
                title: metadata.title || basename(path, extname(path)),
                tags: metadata.tags,
                links: metadata.links,
                backlinks: []
            }
        } catch (e) {
            console.error(`Failed to index file ${path}:`, e)
        }
    }

    // 2. Compute Backlinks
    // Iterate all files (sources)
    for (const sourcePath in index) {
        const sourceEntry = index[sourcePath]

        // Iterate all outgoing links in this source
        for (const linkTarget of sourceEntry.links) {
            // Find the file that matches 'linkTarget'
            // Simple resolution: Does any file in the index have basename == linkTarget?
            // TODO: Handle relative paths, collisions, aliases
            const targetPath = Object.keys(index).find(path => {
                const name = basename(path, extname(path))
                return name === linkTarget
            })

            if (targetPath) {
                // Add sourcePath to targetPath's backlinks
                if (!index[targetPath].backlinks.includes(sourcePath)) {
                    index[targetPath].backlinks.push(sourcePath)
                }
            }
        }
    }

    return index
}
