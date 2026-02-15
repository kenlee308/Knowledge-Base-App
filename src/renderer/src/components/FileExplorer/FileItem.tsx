import React, { useState } from 'react'
import { FileNode } from './utils'

type FileItemProps = {
    node: FileNode
    level: number
    onSelect: (path: string) => void
}

export function FileItem({ node, level, onSelect }: FileItemProps): React.JSX.Element {
    const [isOpen, setIsOpen] = useState(false)

    const handleClick = (e: React.MouseEvent): void => {
        e.stopPropagation()
        if (node.isDirectory) {
            setIsOpen(!isOpen)
        } else {
            onSelect(node.path)
        }
    }

    return (
        <div>
            <div
                onClick={handleClick}
                style={{
                    paddingLeft: `${level * 12 + 8}px`,
                    cursor: 'pointer',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    userSelect: 'none',
                    color: '#e0e0e0'
                }}
                className="file-item-row"
            >
                <span style={{ marginRight: '6px', opacity: 0.7, fontSize: '0.8em' }}>
                    {node.isDirectory ? (isOpen ? '▼' : '▶') : '•'}
                </span>
                <span style={{ fontSize: '0.9em' }}>{node.name}</span>
            </div>

            {node.isDirectory && isOpen && node.children && (
                <div className="file-item-children">
                    {node.children.map((child) => (
                        <FileItem
                            key={child.path + child.name}
                            node={child}
                            level={level + 1}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
