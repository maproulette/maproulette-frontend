/**
 * Detects a one-lock-per-user conflict (HTTP 409) from a rejected task-lock
 * request and normalizes the response body into a plain object, or returns
 * null if the error isn't a lock conflict.
 *
 * @param error - a rejected error from a task lock/lockBundle request, with
 *        `.response` (raw fetch Response) and `.details` (parsed JSON body,
 *        see Server.js's fetchContent/sendContent) if available
 */
export const getLockConflict = (error) => {
  const details = error?.details;
  if (error?.response?.status !== 409 || typeof details?.lockedTaskId !== "number") {
    return null;
  }

  return {
    lockedTaskId: details.lockedTaskId,
    parentName: details.parentName ?? null,
    bundledTasks: details.bundledTasks ?? [],
    startedAt: details.startedAt ?? null,
    message: details.message,
  };
};
