// Editor option values (mirrors MR3 server-side constants)
export const EDITOR = {
  id: 0,
  josm: 1,
  josmLayer: 2,
  level0: 3,
  josmFeatures: 4,
  rapid: 5,
} as const

export const isJosmEditor = (editor: number | null | undefined): boolean =>
  editor === EDITOR.josm || editor === EDITOR.josmLayer || editor === EDITOR.josmFeatures
