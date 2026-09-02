/**
 * Short codes that challenge owners can embed in task instructions to collect
 * a response from the mapper or to offer a value for copying. See the docs'
 * "Templating in Challenge Instructions" page.
 *
 * Codes are written in square brackets — `[copyable "text"]` — but must not be
 * immediately followed by `(`, so a Markdown link like `[label](url)` is left
 * alone. A legacy triple-curly-brace form (`{{{checkbox "…" name="…"}}}`) is
 * still recognised for challenges that predate the bracket syntax. Ordinary
 * mustache tags (`{{property}}`) are untouched.
 */

const SHORT_CODE_PATTERN = /(\{\{\{[^}]+\}\}\}|\[[^\]]+\](?![(]))/

export interface CheckboxToken {
  kind: 'checkbox'
  label: string
  name: string
}

export interface SelectToken {
  kind: 'select'
  label: string
  name: string
  values: string[]
}

export interface CopyableToken {
  kind: 'copyable'
  text: string
}

export interface TextToken {
  kind: 'text'
  text: string
}

export type InstructionToken = TextToken | CheckboxToken | SelectToken | CopyableToken

/** Names of the form fields a set of tokens asks the mapper to fill in. */
export const responseFieldNames = (tokens: InstructionToken[]): string[] =>
  tokens
    .filter(
      (token): token is CheckboxToken | SelectToken =>
        token.kind === 'checkbox' || token.kind === 'select'
    )
    .map((token) => token.name)

const CHECKBOX = /^checkbox[/ ]?"([^"]+)"\s+name="([^"]+)"$/
const SELECT = /^select[/ ]?"([^"]+)"\s+name="([^"]+)"\s+values="([^"]*)"$/
const COPYABLE = /^copyable[/ ]?"([^"]*)"$/

/** Strip the surrounding brackets or triple braces from a matched short code. */
const innerText = (token: string): string =>
  token.startsWith('{{{') ? token.slice(3, -3).trim() : token.slice(1, -1).trim()

const parseShortCode = (token: string): InstructionToken => {
  const inner = innerText(token)

  const checkbox = CHECKBOX.exec(inner)
  if (checkbox) return { kind: 'checkbox', label: checkbox[1], name: checkbox[2] }

  const select = SELECT.exec(inner)
  if (select) {
    return {
      kind: 'select',
      label: select[1],
      name: select[2],
      values: select[3]
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    }
  }

  const copyable = COPYABLE.exec(inner)
  if (copyable) return { kind: 'copyable', text: copyable[1] }

  // Not a short code we know — leave it exactly as the author wrote it, so
  // bracketed prose and unfamiliar codes still read correctly.
  return { kind: 'text', text: token }
}

/**
 * Split instruction text into runs of ordinary Markdown and the short codes
 * embedded in it. Adjacent text runs are merged so Markdown that straddles a
 * short code still renders as one block where possible.
 */
export const tokenizeInstructions = (content: string | null | undefined): InstructionToken[] => {
  if (!content) return []

  const tokens: InstructionToken[] = []
  const pushText = (text: string) => {
    if (!text) return
    const last = tokens[tokens.length - 1]
    if (last?.kind === 'text') last.text += text
    else tokens.push({ kind: 'text', text })
  }

  for (const [index, part] of content.split(SHORT_CODE_PATTERN).entries()) {
    if (!part) continue
    // split() with one capture group alternates: text, capture, text, ...
    if (index % 2 === 1) {
      const parsed = parseShortCode(part)
      if (parsed.kind === 'text') pushText(parsed.text)
      else tokens.push(parsed)
    } else {
      pushText(part)
    }
  }

  return tokens
}

/** Whether instructions contain any short code we would render specially. */
export const hasShortCodes = (content: string | null | undefined): boolean =>
  tokenizeInstructions(content).some((token) => token.kind !== 'text')
