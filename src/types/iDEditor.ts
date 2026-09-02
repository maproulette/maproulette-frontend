/**
 * Structural types for the subset of the iD editor API that MapRoulette
 * interacts with. iD ships as a minified JS bundle via `@openstreetmap/id`
 * with no published `.d.ts` files, so these interfaces are hand-written to
 * mirror only the methods we actually call.
 */

export interface IdSelection {
  selectAll: (selector: string) => IdSelection
  classed: (cls: string, on: boolean) => IdSelection
}

export interface IdMap {
  extent: (padded: [[number, number], [number, number]]) => void
  centerZoom: (center: [number, number], zoom: number) => void
  center: () => [number, number]
  zoom: () => number
  on: (event: string, cb: (() => void) | null) => void
}

export interface IdHistory {
  on: (event: string, cb: (() => void) | null) => void
  changes: () => { modified: unknown[]; created: unknown[]; deleted: unknown[] }
}

/** The subset of an iD entity we read: its current tags. */
export interface IdEntity {
  tags?: Record<string, string>
}

export interface IdContext {
  map: () => IdMap
  history: () => IdHistory
  surface: () => IdSelection | null
  hasEntity: (id: string) => IdEntity | undefined
  entity: (id: string) => IdEntity | undefined
  /** Apply an action to the graph, optionally annotated for the undo stack. */
  perform: (action: unknown, annotation?: string) => void
  enter: (mode: unknown) => void
  defaultChangesetComment: (comment: string) => void
}

export interface IdGlobal {
  modeSelect: (ctx: IdContext, ids: string[]) => unknown
  utilHighlightEntities: (ids: string[], on: boolean, ctx: IdContext) => void
  /** Builds an action replacing an entity's tags wholesale. */
  actionChangeTags: (entityId: string, tags: Record<string, string>) => unknown
}

/** Window type for the iframe hosting `public/id-editor.html`, which exposes
 *  `setupiD()` and the `iD` global after the bundled script loads. */
export type IdIframeWindow = Window & {
  setupiD?: () => IdContext
  iD?: IdGlobal
}

export const getIdGlobal = (win: Window | null | undefined): IdGlobal | undefined =>
  (win as IdIframeWindow | null | undefined)?.iD
