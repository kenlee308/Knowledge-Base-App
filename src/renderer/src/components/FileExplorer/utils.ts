export type FileNode = {
    name: string
    path: string
    isDirectory: boolean
    children?: FileNode[]
}

export function buildFileTree(basePath: string, paths: string[]): FileNode[] {
    const root: FileNode[] = []

    // Normalize base path to ensure consistency
    // Windows paths might come with mixed slashes, standardize to forward slash for processing if needed
    // or rely on the OS separator. For Electron node modules, path.sep is reliable.
    // Here we'll do simple string manipulation assuming standard paths.

    paths.forEach(fullPath => {
        // Remove base path to get relative path
        // We assume paths start with basePath
        let relativePath = fullPath
        if (fullPath.startsWith(basePath)) {
            relativePath = fullPath.substring(basePath.length)
        }

        // Remove leading slash/backslash
        if (relativePath.startsWith('/') || relativePath.startsWith('\\')) {
            relativePath = relativePath.substring(1)
        }

        const parts = relativePath.split(/[/\\]/)
        let currentLevel = root

        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1
            let node = currentLevel.find(n => n.name === part)

            if (!node) {
                node = {
                    name: part,
                    path: isFile ? fullPath : '', // Only leaf nodes need full path for enabling open 
                    // (actually folders might need it too for tracking expansion, let's check)
                    isDirectory: !isFile,
                    children: isFile ? undefined : []
                }
                // If it's a directory, we should reconstruct its path for keys/expansion
                if (!isFile) {
                    // We can reconstruct, or just leave empty if not strictly needed yet.
                    // For simple tree, names are enough if nested.
                    node.path = fullPath.substring(0, fullPath.indexOf(part) + part.length)
                }
                currentLevel.push(node)
            }

            if (node.isDirectory && node.children) {
                currentLevel = node.children
            }
        })
    })

    // Sort: Directories first, then files
    const sortNodes = (nodes: FileNode[]) => {
        nodes.sort((a, b) => {
            if (a.isDirectory === b.isDirectory) {
                return a.name.localeCompare(b.name)
            }
            return a.isDirectory ? -1 : 1
        })
        nodes.forEach(node => {
            if (node.children) sortNodes(node.children)
        })
    }

    sortNodes(root)
    return root
}
