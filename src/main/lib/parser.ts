import matter from 'gray-matter'

export interface NoteMetadata {
    title: string
    tags: string[]
    links: string[]
}

export function parseMarkdown(content: string): NoteMetadata {
    const { data, content: body } = matter(content)

    // Extract tags from frontmatter
    let tags: string[] = []
    if (Array.isArray(data.tags)) {
        tags = data.tags
    } else if (typeof data.tags === 'string') {
        tags = [data.tags]
    }

    // Extract Wikilinks [[Link]]
    const linkRegex = /\[\[(.*?)\]\]/g
    const links: string[] = []
    let match
    while ((match = linkRegex.exec(body)) !== null) {
        // match[1] is the content inside brackets
        // It might differ if we have aliases like [[Link|Alias]], but for now take the raw target
        // If pipe exists, take left side
        const rawLink = match[1]
        const target = rawLink.split('|')[0]
        links.push(target)
    }

    // Extract tags from body (#tag)
    const tagRegex = /(?:^|\s)#([a-zA-Z0-9/_-]+)/g
    let tagMatch
    while ((tagMatch = tagRegex.exec(body)) !== null) {
        const tagName = tagMatch[1]
        if (!tags.includes(tagName)) {
            tags.push(tagName)
        }
    }

    return {
        title: data.title || '',
        tags,
        links
    }
}
