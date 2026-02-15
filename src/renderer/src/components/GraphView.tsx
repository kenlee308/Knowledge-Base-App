import React, { useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

interface GraphViewProps {
    index: any
    onNodeClick: (path: string) => void
}

export const GraphView: React.FC<GraphViewProps> = ({ index, onNodeClick }) => {
    const graphData = useMemo(() => {
        if (!index) return { nodes: [], links: [] }

        const nodes: any[] = []
        const links: any[] = []

        // Create nodes
        Object.keys(index).forEach(path => {
            nodes.push({
                id: path,
                name: index[path].title || path.split(/[/\\]/).pop(),
                val: 1 // size
            })
        })

        // Create links
        Object.keys(index).forEach(sourcePath => {
            const source = index[sourcePath]
            source.links.forEach((targetName: string) => {
                // Resolve targetName to a path in the index
                // This is a naive resolution, similar to the indexer logic
                // We look for a node whose basename matches the link target
                const targetPath = Object.keys(index).find(p => {
                    const name = p.split(/[/\\]/).pop()?.replace('.md', '')
                    return name === targetName
                })

                if (targetPath) {
                    links.push({
                        source: sourcePath,
                        target: targetPath
                    })
                }
            })
        })

        return { nodes, links }
    }, [index])

    return (
        <div style={{ width: '100%', height: '100%', background: '#1e1e1e' }}>
            <ForceGraph2D
                graphData={graphData}
                nodeLabel="name"
                nodeColor={() => '#a277ff'} // customized color
                linkColor={() => '#555'}
                backgroundColor="#1e1e1e"
                onNodeClick={(node: any) => onNodeClick(node.id)}
            />
        </div>
    )
}
