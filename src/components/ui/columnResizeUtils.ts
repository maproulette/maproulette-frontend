export const MIN_COLUMN_WIDTH = 40

export function computeResizedWidth(
  startWidth: number,
  startX: number,
  clientX: number,
  minWidth = MIN_COLUMN_WIDTH
): number {
  return Math.max(minWidth, startWidth + clientX - startX)
}

export function computeTotalWidth(widths: number[]): number {
  return widths.reduce((sum, width) => sum + width, 0)
}
