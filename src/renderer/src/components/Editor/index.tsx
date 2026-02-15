import React, { useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import './editor.css'

interface EditorProps {
    initialContent: string
    onChange: (value: string) => void
    onNavigate?: (link: string) => void
    onHover?: (link: string | null) => void
    vaultPath?: string | null
}

import { wikilinkExtension, createAllImageExtensions } from './extensions'

export const Editor: React.FC<EditorProps> = ({ initialContent, onChange, onNavigate, onHover, vaultPath }) => {
    const handleChange = useCallback((val: string) => {
        onChange(val)
    }, [onChange])

    const clickHandler = React.useMemo(() => EditorView.domEventHandlers({
        mousedown: (event, _view) => {
            const target = event.target as HTMLElement
            // Handle Ctrl+Click (or Cmd+Click) to navigate
            const isMod = event.ctrlKey || event.metaKey
            const linkElement = target.closest('.cm-wikilink')

            if (linkElement && isMod) {
                const link = linkElement.getAttribute('data-link')
                if (link && onNavigate) {
                    event.preventDefault() // Prevent cursor placement
                    onNavigate(link)
                }
            }
        },
        mouseover: (event, _view) => {
            const target = event.target as HTMLElement
            const linkElement = target.closest('.cm-wikilink')
            if (linkElement) {
                const link = linkElement.getAttribute('data-link')
                if (link && onHover) onHover(link)
            } else {
                if (onHover) onHover(null)
            }
        },
        mouseout: (event, _view) => {
            // Simple clear on mouseout of editor might be too aggressive, 
            // but 'mouseout' bubbles. 
            // Better: if target IS a wikilink, and we mouse out of it.
            const target = event.target as HTMLElement
            if (target.matches('.cm-wikilink')) {
                if (onHover) onHover(null)
            }
        }
    }), [onNavigate, onHover])

    // Memoize extensions
    const extensions = React.useMemo(() => {
        const exts = [
            markdown({ base: markdownLanguage, codeLanguages: languages }),
            EditorView.lineWrapping,
            wikilinkExtension,
            clickHandler
        ]
        if (vaultPath) {
            exts.push(...createAllImageExtensions(vaultPath))
        }
        return exts
    }, [clickHandler, vaultPath])

    return (
        <div className="editor-container" style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
            <CodeMirror
                value={initialContent}
                height="100%"
                theme={oneDark}
                extensions={extensions}
                onChange={handleChange}
                basicSetup={{
                    foldGutter: false,
                    dropCursor: false,
                    allowMultipleSelections: false,
                    indentOnInput: false,
                }}
            />
        </div>
    )
}
