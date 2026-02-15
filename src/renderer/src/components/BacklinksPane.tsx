import React from 'react'
// import { FileNode } from '../FileExplorer/utils'

interface BacklinksPaneProps {
    currentFile: string | null
    index: any // using any for now, ideally strictly typed shared interface
    onSelect: (path: string) => void
}

export const BacklinksPane: React.FC<BacklinksPaneProps> = ({ currentFile, index, onSelect }) => {
    if (!currentFile || !index || !index[currentFile]) {
        return <div style={{ padding: '10px', opacity: 0.5 }}>No backlinks available</div>
    }

    const backlinks = index[currentFile].backlinks || []

    return (
        <div className="backlinks-pane" style={{ padding: '10px' }}>
            <h3>Backlinks</h3>
            <p style={{ fontSize: '0.8em', opacity: 0.7 }}>{backlinks.length} linked mentions</p>

            <div style={{ marginTop: '10px' }}>
                {backlinks.length === 0 ? (
                    <div style={{ fontStyle: 'italic', opacity: 0.5 }}>No incoming links</div>
                ) : (
                    backlinks.map((path: string) => (
                        <div
                            key={path}
                            onClick={() => onSelect(path)}
                            style={{
                                padding: '5px',
                                marginBottom: '5px',
                                background: '#333',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.9em'
                            }}
                        >
                            {path.split(/[/\\]/).pop()}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
