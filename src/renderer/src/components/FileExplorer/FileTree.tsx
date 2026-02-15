import React from 'react'
import { FileNode } from './utils'
import { FileItem } from './FileItem'

type FileTreeProps = {
    nodes: FileNode[]
    onSelect: (path: string) => void
}

export function FileTree({ nodes, onSelect }: FileTreeProps): React.JSX.Element {
    return (
        <div className="file-tree" style={{ padding: '8px 0' }}>
            {nodes.map((node) => (
                <FileItem
                    key={node.path + node.name}
                    node={node}
                    level={0}
                    onSelect={onSelect}
                />
            ))}
        </div>
    )
}
