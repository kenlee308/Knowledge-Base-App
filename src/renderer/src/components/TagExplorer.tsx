import React from 'react'

interface TagExplorerProps {
    index: any
    onTagClick: (tag: string) => void
}

export const TagExplorer: React.FC<TagExplorerProps> = ({ index, onTagClick }) => {
    const tagCounts = React.useMemo(() => {
        if (!index) return {}
        const counts: Record<string, number> = {}
        Object.values(index).forEach((entry: any) => {
            if (entry.tags) {
                entry.tags.forEach((tag: string) => {
                    counts[tag] = (counts[tag] || 0) + 1
                })
            }
        })
        return counts
    }, [index])

    const sortedTags = React.useMemo(() => {
        return Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a])
    }, [tagCounts])

    if (sortedTags.length === 0) return null

    return (
        <div className="tag-explorer" style={{ padding: '10px', borderTop: '1px solid #333' }}>
            <div style={{ color: '#888', textTransform: 'uppercase', fontSize: '0.8em', marginBottom: '10px' }}>Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {sortedTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => onTagClick(tag)}
                        style={{
                            background: '#333',
                            color: '#aaa',
                            border: '1px solid #444',
                            borderRadius: '12px',
                            padding: '2px 8px',
                            fontSize: '0.8em',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.color = '#fff'
                            e.currentTarget.style.borderColor = '#a277ff'
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.color = '#aaa'
                            e.currentTarget.style.borderColor = '#444'
                        }}
                    >
                        #{tag} <span style={{ opacity: 0.5, fontSize: '0.9em' }}>{tagCounts[tag]}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
