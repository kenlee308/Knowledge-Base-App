import {
    Decoration,
    DecorationSet,
    EditorView,
    ViewPlugin,
    ViewUpdate,
    MatchDecorator,
    WidgetType
} from '@codemirror/view'

// --- Wikilinks ---
const wikilinkDecorator = new MatchDecorator({
    regexp: /\[\[(.*?)\]\]/g,
    decoration: (match) => {
        return Decoration.mark({
            class: 'cm-wikilink',
            tagName: 'span',
            attributes: {
                'data-link': match[1],
                'title': 'Ctrl + Click to open'
            }
        })
    }
})

export const wikilinkExtension = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet
        constructor(view: EditorView) {
            this.decorations = wikilinkDecorator.createDeco(view)
        }
        update(update: ViewUpdate) {
            this.decorations = wikilinkDecorator.updateDeco(update, this.decorations)
        }
    },
    {
        decorations: (v) => v.decorations
    }
)

// --- Images ---
class ImageWidget extends WidgetType {
    constructor(readonly src: string) { super() }

    toDOM() {
        const img = document.createElement('img')
        img.src = this.src
        img.className = 'cm-image-preview'
        img.style.maxWidth = '100%'
        img.style.maxHeight = '300px'
        img.style.display = 'block'
        img.style.marginTop = '5px'
        img.style.borderRadius = '4px'
        return img
    }
}

// Improved helper to return both
export const createAllImageExtensions = (vaultPath: string) => {
    console.log('[Editor] Creating image extensions for:', vaultPath)

    const standardPlugin = ViewPlugin.fromClass(class {
        decorations: DecorationSet;
        decorator = new MatchDecorator({
            regexp: /!\[(.*?)\]\((.*?)\)/g,
            decoration: (match) => {
                let src = match[2]
                if (!src.startsWith('http')) {
                    const cleanSrc = src.replace(/^\.\//, '')
                    // Robust construct: vault://<fullPath>
                    // Encode only the filename part possibly, but main process decodes full path.
                    // Easiest: vault://<fullPath> with forward slashes.
                    const fullPath = `${vaultPath}/${cleanSrc}`.replace(/\\/g, '/')
                    src = `vault://${fullPath}`
                }
                console.log('[Editor] Matched standard image:', src)
                return Decoration.replace({
                    widget: new ImageWidget(src),
                })
            }
        })
        constructor(view: EditorView) { this.decorations = this.decorator.createDeco(view) }
        update(update: ViewUpdate) { this.decorations = this.decorator.updateDeco(update, this.decorations) }
    }, { decorations: v => v.decorations })

    const wikiPlugin = ViewPlugin.fromClass(class {
        decorations: DecorationSet;
        decorator = new MatchDecorator({
            regexp: /!\[\[(.*?)\]\]/g,
            decoration: (match) => {
                const fullPath = `${vaultPath}/${match[1]}`.replace(/\\/g, '/')
                const src = `vault://${fullPath}`
                console.log('[Editor] Matched wiki image:', src)
                return Decoration.replace({
                    widget: new ImageWidget(src),
                })
            }
        })
        constructor(view: EditorView) { this.decorations = this.decorator.createDeco(view) }
        update(update: ViewUpdate) { this.decorations = this.decorator.updateDeco(update, this.decorations) }
    }, { decorations: v => v.decorations })

    return [standardPlugin, wikiPlugin]
}
