import React, { useState, useEffect, useRef } from 'react'

interface Command {
    id: string
    name: string
    action: () => void
    shortcut?: string
}

interface CommandPaletteProps {
    isOpen: boolean
    onClose: () => void
    commands: Command[]
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    const filteredCommands = commands.filter(cmd =>
        cmd.name.toLowerCase().includes(query.toLowerCase())
    )

    useEffect(() => {
        if (isOpen) {
            setQuery('')
            setSelectedIndex(0)
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [isOpen])

    useEffect(() => {
        setSelectedIndex(0)
    }, [query])

    if (!isOpen) return null

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => (prev + 1) % filteredCommands.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length)
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (filteredCommands[selectedIndex]) {
                filteredCommands[selectedIndex].action()
                onClose()
            }
        } else if (e.key === 'Escape') {
            onClose()
        }
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
            paddingTop: '100px'
        }} onClick={onClose}>
            <div style={{
                width: '500px', background: '#252526', borderRadius: '5px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)', overflow: 'hidden',
                border: '1px solid #444'
            }} onClick={e => e.stopPropagation()}>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a command..."
                    style={{
                        width: '100%', padding: '15px', border: 'none',
                        background: 'transparent', color: '#fff', fontSize: '1.1em',
                        outline: 'none', borderBottom: '1px solid #333'
                    }}
                />
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {filteredCommands.map((cmd, index) => (
                        <div
                            key={cmd.id}
                            onClick={() => { cmd.action(); onClose() }}
                            onMouseEnter={() => setSelectedIndex(index)}
                            style={{
                                padding: '10px 15px', color: '#ccc', cursor: 'pointer',
                                background: index === selectedIndex ? '#37373d' : 'transparent',
                                display: 'flex', justifyContent: 'space-between'
                            }}
                        >
                            <span>{cmd.name}</span>
                            {cmd.shortcut && (
                                <span style={{ fontSize: '0.8em', color: '#aaa', background: '#333', padding: '2px 6px', borderRadius: '3px' }}>
                                    {cmd.shortcut}
                                </span>
                            )}
                        </div>
                    ))}
                    {filteredCommands.length === 0 && (
                        <div style={{ padding: '15px', color: '#666', textAlign: 'center' }}>No commands found</div>
                    )}
                </div>
            </div>
        </div>
    )
}
