import remarkBreaks from 'remark-breaks'
import type { PluggableList } from 'unified'

/**
 * Shared remark plugins for all Markdown rendering.
 *
 * `remark-breaks` renders single newlines in the source as hard line breaks
 * (`<br>`), matching what users see while typing in the instruction/comment
 * input boxes. Without it, CommonMark collapses single newlines into spaces,
 * which is confusing for authors who don't write Markdown deliberately. Authors
 * who want the collapsing behavior can simply remove the line break in the
 * source text.
 */
export const markdownRemarkPlugins: PluggableList = [remarkBreaks]
