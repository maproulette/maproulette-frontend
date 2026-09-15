/** RFC 7464 record separator that frames each record in a JSON text sequence. */
const RECORD_SEPARATOR = 0x1e
/** Bytes read to inspect the leading byte without loading a large file. */
const DETECTION_HEAD_BYTES = 8

type JsonSubmission = {
  kind: 'json'
  geoJSON: unknown
}

type LineByLineSubmission = {
  kind: 'lineByLine'
  file: File
}

export type LocalGeoJSONSubmission = JsonSubmission | LineByLineSubmission

export const isLineByLineGeoJSONText = (text: string) => text.charCodeAt(0) === RECORD_SEPARATOR

const isCompleteJSON = (line: string) => {
  try {
    JSON.parse(line)
    return true
  } catch {
    return false
  }
}

/**
 * Whether the text is one task per line, delimited by plain newlines rather
 * than RFC 7464 record separators. This mirrors the backend's own rule (see
 * `isLineByLineGeoJson` in ChallengeProvider): two or more lines, the first
 * two each a complete JSON document. A pretty-printed single collection fails
 * it — its first line is an unclosed `{` — and so is parsed as one document.
 */
export const isNewlineDelimitedGeoJSONText = (text: string) => {
  const lines = text.split('\n').filter((line) => line.trim() !== '')
  return lines.length > 1 && isCompleteJSON(lines[0]) && isCompleteJSON(lines[1])
}

export const detectLocalGeoJSONSubmission = async (file: File): Promise<LocalGeoJSONSubmission> => {
  const head = await file.slice(0, DETECTION_HEAD_BYTES).text()
  if (isLineByLineGeoJSONText(head)) {
    return { kind: 'lineByLine', file }
  }

  const text = await file.text()
  if (isNewlineDelimitedGeoJSONText(text)) {
    return { kind: 'lineByLine', file }
  }

  return { kind: 'json', geoJSON: JSON.parse(text) }
}
