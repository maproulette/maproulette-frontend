/**
 * Structural types for the subset of the iD editor API that MapRoulette
 * interacts with. iD ships as a minified JS bundle via `@openstreetmap/id`
 * with no published `.d.ts` files, so these interfaces are hand-written to
 * mirror only the methods we actually call.
 */

interface IdSelection {
  selectAll: (selector: string) => IdSelection
  classed: (cls: string, on: boolean) => IdSelection
}

interface IdMap {
  extent: (padded: [[number, number], [number, number]]) => void
  centerZoom: (center: [number, number], zoom: number) => void
  center: () => [number, number]
  zoom: () => number
  on: (event: string, cb: (() => void) | null) => void
}

export interface IdHistory {
  on: (event: string, cb: (() => void) | null) => void
  changes: () => { modified: IdEntity[]; created: IdEntity[]; deleted: IdEntity[] }
  /** The graph as it was before the current edits. */
  base: () => IdGraph
  /** Remember the current edit stack under a key, to come back to later. */
  checkpoint: (key: string) => void
  /** Return to a remembered checkpoint, discarding everything done since. */
  reset: (key?: string) => void
}

/** The subset of an iD entity we read: what it is, and how it currently looks. */
export interface IdEntity {
  id?: string
  type?: string
  tags?: Record<string, string>
  /** A node's position. */
  loc?: [number, number]
  /** A way's child nodes, in order. */
  nodes?: string[]
  /** A relation's members. */
  members?: { id?: string; type?: string; role?: string }[]
}

/** iD's edit graph, used to look an entity up as it was before editing. */
export interface IdGraph {
  hasEntity: (id: string) => IdEntity | undefined
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
  /** iD's do-nothing mode, which holds no entity and so survives any edit. */
  modeBrowse: (ctx: IdContext) => unknown
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

/**
 * Whether iD has downloaded an element yet. iD fetches OSM data as the map
 * settles and again as the mapper pans or zooms, so an element the task names
 * can be absent from the graph for a while after the editor opens.
 */
export const isEntityLoaded = (context: IdContext, entityId: string): boolean => {
  try {
    return !!context.hasEntity(entityId)
  } catch {
    return false
  }
}
