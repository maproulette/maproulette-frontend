// Different challenge endpoints disagree on the shape of a challenge's
// `parent` field: some return the plain project id, while others (backend
// endpoints that run `ParentMixin.insertProjectJSON`, e.g. saved challenges)
// embed the full project object instead. Normalize either shape into a
// display-ready { id, name }.
export const getParentInfo = (parent: unknown) => {
  if (typeof parent === 'object' && parent !== null) {
    const parentObj = parent as { id?: number; name?: string }
    return { id: parentObj.id ?? null, name: parentObj.name || 'Unknown Project' }
  }
  if (typeof parent === 'number' || typeof parent === 'string') {
    return { id: parent, name: 'Unknown Project' }
  }
  return { id: null, name: 'Unknown Project' }
}

/**
 * Normalize a challenge's `parent` to the plain project id, whichever shape the
 * endpoint returned it in. Returns undefined when there is no usable id.
 */
export const getParentId = (parent: unknown): number | undefined => {
  if (typeof parent === 'object' && parent !== null) {
    const id = (parent as { id?: number }).id
    return typeof id === 'number' ? id : undefined
  }
  if (typeof parent === 'number') return parent
  if (typeof parent === 'string' && parent !== '') {
    const id = Number(parent)
    return Number.isNaN(id) ? undefined : id
  }
  return undefined
}

/**
 * Return the challenge with an embedded `parent` project object collapsed back
 * to its id, so the value matches what `GET /challenge/{id}` returns. Callers
 * that feed `parent` into a project request or query key need the scalar —
 * an object stringifies into URLs as `[object Object]`.
 */
export const withScalarParent = <T extends { parent?: unknown }>(challenge: T): T => {
  if (typeof challenge.parent !== 'object' || challenge.parent === null) return challenge
  const parentId = getParentId(challenge.parent)
  return parentId === undefined ? challenge : ({ ...challenge, parent: parentId } as T)
}
