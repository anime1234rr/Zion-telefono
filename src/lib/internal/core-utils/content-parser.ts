export type ContentNode =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'code'; value: string }
  | { type: 'mention'; username: string }
  | { type: 'channel'; name: string }
  | { type: 'link'; url: string }

const TOKEN_PATTERN = new RegExp(
  [
    '\\*\\*(?<bold>.+?)\\*\\*',
    '\\*(?<italic>[^*\\n]+?)\\*',
    '`(?<code>[^`\\n]+?)`',
    '@(?<mention>[a-zA-Z0-9_]{1,32})',
    '#(?<channel>[a-zA-Z0-9_-]{1,64})',
    '(?<link>https?://[^\\s<>"\']+)',
  ].join('|'),
  'g'
)

export function parseInlineContent(text: string): ContentNode[] {
  const nodes: ContentNode[] = []
  let lastIndex = 0

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      nodes.push({ type: 'text', value: text.slice(lastIndex, index) })
    }

    const groups = match.groups ?? {}
    if (groups.bold !== undefined) {
      nodes.push({ type: 'bold', value: groups.bold })
    } else if (groups.italic !== undefined) {
      nodes.push({ type: 'italic', value: groups.italic })
    } else if (groups.code !== undefined) {
      nodes.push({ type: 'code', value: groups.code })
    } else if (groups.mention !== undefined) {
      nodes.push({ type: 'mention', username: groups.mention })
    } else if (groups.channel !== undefined) {
      nodes.push({ type: 'channel', name: groups.channel })
    } else if (groups.link !== undefined) {
      nodes.push({ type: 'link', url: groups.link })
    }

    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return nodes
}
