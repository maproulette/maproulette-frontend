import _cloneDeep from "lodash/cloneDeep";
import _isEmpty from "lodash/isEmpty";
import _isObject from "lodash/isObject";
import _isString from "lodash/isString";
import _keys from "lodash/keys";
import _map from "lodash/map";
import _pick from "lodash/pick";
import _remove from "lodash/remove";
import _values from "lodash/values";
import { schema } from "normalizr";
import { v1 as uuidv1 } from "uuid";
import { challengeSchema } from "../Challenge/Challenge";
import { commentSchema, receiveComments } from "../Comment/Comment";
import AppErrors from "../Error/AppErrors";
import { addError, addErrorWithDetails, addServerError } from "../Error/Error";
import { fetchPlace, placeSchema } from "../Place/Place";
import { generateSearchParametersString } from "../Search/Search";
import Endpoint from "../Server/Endpoint";
import genericEntityReducer from "../Server/GenericEntityReducer";
import RequestStatus from "../Server/RequestStatus";
import { defaultRoutes as api, isSecurityError, websocketClient } from "../Server/Server";
import { ensureUserLoggedIn } from "../User/User";
import { receiveClusteredTasks } from "./ClusteredTask";
import { markReviewDataStale } from "./TaskReview/TaskReview";
import { TaskStatus } from "./TaskStatus/TaskStatus";

/** normalizr schema for tasks */
export const taskSchema = function () {
  return new schema.Entity("tasks");
};

/** normalizr schema for task tags */
export const taskTagsSchema = function () {
  return new schema.Entity("tags");
};

export const taskBundleSchema = function () {
  return new schema.Entity("taskBundles", { tasks: [taskSchema()] });
};

/**
 * normalizr denormalization schema, which will pull in projects and places
 * (fetched separately, so not needed in normal schema)
 */
export const taskDenormalizationSchema = function () {
  return new schema.Entity("tasks", {
    parent: challengeSchema(),
    place: placeSchema(),
    comments: [commentSchema()],
  });
};

export const subscribeToChallengeTaskMessages = function (dispatch, challengeId) {
  websocketClient.addServerSubscription(
    "challengeTasks",
    challengeId,
    "challengeTaskMessageHandler",
    (messageObject) => onChallengeTaskMessage(dispatch, messageObject),
  );
};

export const unsubscribeFromChallengeTaskMessages = function (challengeId) {
  websocketClient.removeServerSubscription(
    "challengeTasks",
    challengeId,
    "challengeTaskMessageHandler",
  );
};

export const subscribeToReviewMessages = function (dispatch) {
  websocketClient.addServerSubscription("reviews", null, "reviewMessageHandler", (messageObject) =>
    onReviewMessage(dispatch, messageObject),
  );
};

export const unsubscribeFromReviewMessages = function () {
  websocketClient.removeServerSubscription("reviews", null, "reviewMessageHandler");
};

export const subscribeToAllTasks = function (callback, handle) {
  websocketClient.addServerSubscription("tasks", null, handle, (messageObject) =>
    callback(messageObject),
  );
};

export const unsubscribeFromAllTasks = function (handle) {
  websocketClient.removeServerSubscription("tasks", null, handle);
};

const onReviewMessage = function (dispatch, messageObject) {
  switch (messageObject.messageType) {
    case "review-new":
    case "review-claimed":
    case "review-update":
      // For now just mark the existing review data as stale
      dispatch(markReviewDataStale());
      break;
    default:
      break; // Ignore
  }
};

const onChallengeTaskMessage = function (dispatch, messageObject) {
  switch (messageObject.messageType) {
    case "task-claimed":
      const task = Object.assign({}, messageObject.data.task, {
        lockedBy: messageObject?.data?.byUser?.userId,
      });
      dispatchTaskUpdateNotification(dispatch, task);
      break;
    case "tasks-claimed":
      const claimedTasks = messageObject.data.tasks.map((task) => {
        return Object.assign({}, task, {
          lockedBy: messageObject?.data?.byUser?.userId,
        });
      });
      dispatchTaskUpdateNotification(dispatch, claimedTasks);
      break;
    case "task-released":
      dispatchTaskUpdateNotification(dispatch, messageObject.data.task);
      break;
    case "tasks-released":
      const releasedTasks = messageObject.data.tasks.map((task) => {
        return Object.assign({}, task, {
          lockedBy: null,
        });
      });
      dispatchTaskUpdateNotification(dispatch, releasedTasks);
      break;
    case "task-update":
      dispatchTaskUpdateNotification(dispatch, messageObject.data.task);
      break;
    case "tasks-update":
      const updatedTasks = messageObject.data.tasks.map((task) => {
        return Object.assign({}, task, {
          lockedBy: messageObject?.data?.byUser?.userId,
        });
      });
      dispatchTaskUpdateNotification(dispatch, updatedTasks);
      break;
    default:
      break; // Ignore
  }
};

const dispatchTaskUpdateNotification = function (dispatch, task) {
  if (Array.isArray(task)) {
    const tasksById = {};
    const clusteredTasks = task.map((t) => {
      tasksById[t.id] = t;

      return Object.assign(
        {},
        _pick(t, ["id", "created", "modified", "priority", "status", "difficulty", "lockedBy"]),
        {
          parentId: t.parent,
          point: {
            lng: t.location.coordinates[0],
            lat: t.location.coordinates[1],
          },
          title: t.name,
          type: 2,
        },
      );
    });

    const tasksByParent = {};
    task.forEach((t) => {
      if (!tasksByParent[t.parent]) {
        tasksByParent[t.parent] = [];
      }
      tasksByParent[t.parent].push(t);
    });

    dispatch(receiveTasks({ tasks: tasksById }));

    Object.keys(tasksByParent).forEach((parentId) => {
      const parentTasks = clusteredTasks.filter((t) => t.parentId === parseInt(parentId));
      dispatch(
        receiveClusteredTasks(
          parseInt(parentId),
          false,
          parentTasks,
          RequestStatus.success,
          uuidv1(),
          true,
          true,
        ),
      );
    });
  } else {
    dispatch(receiveTasks(simulatedEntities(task)));
    dispatch(
      receiveClusteredTasks(
        task.parent,
        false,
        [
          Object.assign(
            {},
            _pick(task, [
              "id",
              "created",
              "modified",
              "priority",
              "status",
              "difficulty",
              "lockedBy",
            ]),
            {
              parentId: task.parent,
              point: {
                lng: task.location.coordinates[0],
                lat: task.location.coordinates[1],
              },
              title: task.name,
              type: 2,
            },
          ),
        ],
        RequestStatus.success,
        uuidv1(),
        true,
        true,
      ),
    );
  }
};

// redux actions
const RECEIVE_TASKS = "RECEIVE_TASKS";
const CLEAR_TASKS = "CLEAR_TASKS";
const CLEAR_TASK_BUNDLE = "CLEAR_TASK_BUNDLE";
const REMOVE_TASK = "REMOVE_TASK";
const REMOVE_TASK_FROM_BUNDLE = "REMOVE_TASK_FROM_BUNDLE";

// redux action creators

/**
 * Add or update task data in the redux store
 */
export const receiveTasks = function (normalizedEntities) {
  return {
    type: RECEIVE_TASKS,
    status: RequestStatus.success,
    entities: normalizedEntities,
    receivedAt: Date.now(),
  };
};

/**
 * Clear task data for a given challenge from the redux store
 */
export const clearTasks = function (challengeId) {
  return {
    type: CLEAR_TASKS,
    status: RequestStatus.success,
    challengeId: challengeId,
    receivedAt: Date.now(),
  };
};

/**
 * Clear task data for a given bundle from the redux store
 */
export const clearTaskBundle = function (bundleId) {
  return {
    type: CLEAR_TASK_BUNDLE,
    status: RequestStatus.success,
    bundleId: bundleId,
    receivedAt: Date.now(),
  };
};

/**
 * Remove a task from the redux store
 */
export const removeTask = function (taskId) {
  return {
    type: REMOVE_TASK,
    taskId,
    receivedAt: Date.now(),
  };
};

/**
 * Remove a task from a bundle in the redux store
 */
export const removeTaskFromBundle = function (taskId) {
  return {
    type: REMOVE_TASK_FROM_BUNDLE,
    taskId,
    receivedAt: Date.now(),
  };
};

// async action creators

/**
 * Fetch data for the given task. Normally that data will be added to the redux
 * store, but that can be suppressed with the supressReceive flag.
 *
 * If info on available mapillary images for the task is also desired, set
 * includeMapillary to true
 */
export const fetchTask = function (taskId, suppressReceive = false, includeMapillary = false) {
  return function (dispatch) {
    return new Endpoint(api.task.single, {
      schema: taskSchema(),
      variables: { id: taskId },
      params: { mapillary: includeMapillary },
    })
      .execute()
      .then((normalizedResults) => {
        if (!suppressReceive) {
          dispatch(receiveTasks(normalizedResults.entities));
        }
        return normalizedResults;
      })
      .catch((error) => {
        dispatch(addError(AppErrors.task.fetchFailure));
        console.error("Error fetching task:", error);
      });
  };
};

/**
 * Fetch tags for the given task.
 */
export const fetchTaskTags = function (taskId) {
  return function (dispatch) {
    return new Endpoint(api.task.tags, {
      schema: {},
      variables: { id: taskId },
    })
      .execute()
      .then((normalizedTags) => {
        if (_isObject(normalizedTags.result)) {
          // Inject tags into task
          dispatch(
            receiveTasks(
              simulatedEntities({
                id: taskId,
                tags: _values(normalizedTags.result),
              }),
            ),
          );
        }
        return normalizedTags;
      });
  };
};

/**
 * Locks a task that is to be started.
 */
export const startTask = function (taskId) {
  return function (dispatch) {
    return new Endpoint(api.task.start, {
      schema: taskSchema(),
      variables: { id: taskId },
    })
      .execute()
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).catch(() => null);
        }
        throw error;
      });
  };
};

/**
 * Unlocks a task.
 */
export const releaseTask = function (taskId) {
  return function (dispatch) {
    return new Endpoint(api.task.release, {
      schema: taskSchema(),
      variables: { id: taskId },
    })
      .execute()
      .then((normalizedResults) => {
        dispatch(receiveTasks(normalizedResults.entities));
        return normalizedResults;
      })
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn())
            .then(() => dispatch(addError(AppErrors.user.unauthorized)))
            .catch(() => null);
        } else {
          dispatch(addError(AppErrors.task.lockReleaseFailure));
          console.log(error.response || error);
        }
      });
  };
};

/**
 * Refreshes an active task lock owned by the current user
 */
export const refreshTaskLock = function (taskId) {
  return function () {
    return new Endpoint(api.task.refreshLock, {
      schema: taskSchema(),
      variables: { id: taskId },
    }).execute();
  };
};

/**
 * Release multiple tasks at once
 */
export const releaseMultipleTasks = function (taskIds) {
  return function () {
    // Don't make API call if no tasks to release
    if (!taskIds || taskIds.length === 0) {
      return Promise.resolve([]);
    }

    return new Endpoint(api.task.releaseMultipleTasks, {
      schema: [taskSchema()],
      params: { taskIds: taskIds },
    })
      .execute()
      .catch((error) => {
        // Just log the error and don't throw - this allows the UI to continue
        // even if some tasks couldn't be unlocked
        console.warn("Error releasing multiple tasks:", error);
        return []; // Return empty array to avoid breaking UI
      });
  };
};

/**
 * Locks a task bundle's primary task, recording the given member task ids as
 * the lock's bundled tasks (replacing whatever membership it covered before).
 * Rejects (with `error.details` populated on a 409) rather than swallowing
 * errors, since callers need to detect a one-lock-per-user conflict.
 */
export const lockTaskBundle = function (primaryTaskId, memberTaskIds) {
  return function (dispatch) {
    return new Endpoint(api.task.lockTaskBundle, {
      variables: { taskId: primaryTaskId },
      params: { taskIds: memberTaskIds || [] },
    })
      .execute()
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).catch(() => null);
        }

        throw error;
      });
  };
};

/**
 * Mark the given task as completed with the given status.
 */
export const completeTask = async function (
  taskId,
  taskStatus,
  needsReview,
  tags,
  cooperativeWorkSummary,
  osmComment,
  completionResponses,
) {
  return async function (dispatch) {
    return await updateTaskStatus(
      dispatch,
      taskId,
      taskStatus,
      needsReview,
      tags,
      cooperativeWorkSummary,
      osmComment,
      completionResponses,
    );
  };
};

/**
 * Mark all tasks in the given bundle as completed with the given status
 */
export const completeTaskBundle = async function (
  bundleId,
  primaryTaskId,
  taskStatus,
  needsReview,
  tags,
  cooperativeWorkSummary,
  osmComment,
  completionResponses,
) {
  return async function (dispatch) {
    return await updateBundledTasksStatus(
      dispatch,
      bundleId,
      primaryTaskId,
      taskStatus,
      needsReview,
      tags,
      cooperativeWorkSummary,
      osmComment,
      completionResponses,
    );
  };
};

/**
 * Bulk update the given tasks. Note that the bulk update APIs require ids to
 * be represented as strings, and this function will therefore automatically
 * perform a conversion unless skipConversion is true.
 */
export const bulkUpdateTasks = function (updatedTasks, skipConversion = false) {
  return function (dispatch) {
    const taskData = skipConversion
      ? updatedTasks
      : _map(updatedTasks, (task) => Object.assign({}, task, { id: task.id.toString() }));

    return new Endpoint(api.tasks.bulkUpdate, { json: taskData })
      .execute()
      .then(() => {
        // Clear all tasks in challenge since we don't know exactly which tasks
        // are impacted by these changes (as bundling could be affected)
        if (taskData.length > 0) {
          dispatch(clearTasks(taskData[0].parentId));
        }
      })
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          dispatch(addError(AppErrors.task.updateFailure));
          console.log(error.response || error);
        }
      });
  };
};

/**
 * Bulk update task status on tasks that match the given criteria.
 */
export const bulkTaskStatusChange = function (newStatus, challengeId, criteria, excludeTaskIds) {
  return function (dispatch) {
    const filters = criteria?.filters ?? {};
    const searchParameters = generateSearchParametersString(
      filters,
      criteria.boundingBox,
      criteria?.savedChallengesOnly,
      null,
      criteria.searchQuery,
      criteria?.invertFields,
      excludeTaskIds,
    );
    searchParameters.cid = challengeId;

    return new Endpoint(api.tasks.bulkStatusChange, {
      params: { ...searchParameters, newStatus },
      json: filters.taskPropertySearch ? { taskPropertySearch: filters.taskPropertySearch } : null,
    })
      .execute()
      .then(() => {
        dispatch(clearTasks(challengeId));
      })
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          dispatch(addError(AppErrors.task.updateFailure));
          console.log(error.response || error);
        }
      });
  };
};

/**
 * Updates the completion responses on a task.
 */
export const updateCompletionResponses = function (taskId, completionResponses) {
  return function (dispatch) {
    return new Endpoint(api.task.updateCompletionResponses, {
      variables: { id: taskId },
      json: completionResponses,
    })
      .execute()
      .then(() => {
        fetchTask(taskId)(dispatch); // Refresh task data
      })
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          dispatch(addError(AppErrors.task.updateFailure));
          console.log(error.response || error);
        }
      });
  };
};

/**
 * Add a comment to the given task, associating the given task status if
 * provided.
 */
export const addTaskComment = function (taskId, comment, taskStatus) {
  return function (dispatch) {
    const params = {};
    if (Number.isFinite(taskStatus)) {
      params.actionId = taskStatus;
    }

    return new Endpoint(api.task.addComment, {
      variables: { id: taskId },
      params,
      json: { comment: comment },
    })
      .execute()
      .then(() => {
        fetchTaskComments(taskId)(dispatch);
        fetchTask(taskId)(dispatch); // Refresh task data
      })
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          dispatch(addError(AppErrors.task.addCommentFailure));
          console.log(error.response || error);
        }
      });
  };
};

/**
 * Edit an existing comment on the given task
 */
export const editTaskComment = function (taskId, commentId, newComment) {
  return function (dispatch) {
    return new Endpoint(api.task.editComment, {
      variables: { id: commentId },
      json: { comment: newComment },
    })
      .execute()
      .then(() => {
        fetchTaskComments(taskId)(dispatch);
        fetchTask(taskId)(dispatch); // Refresh task data
      })
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          dispatch(addError(AppErrors.task.editCommentFailure));
          console.log(error.response || error);
        }
      });
  };
};

/**
 * Add a comment to tasks in the given bundle, associating the given task
 * status if provided
 */
export const addTaskBundleComment = function (bundleId, primaryTaskId, comment, taskStatus) {
  return function (dispatch) {
    const params = {};
    if (Number.isFinite(taskStatus)) {
      params.actionId = taskStatus;
    }
    return new Endpoint(api.tasks.bundled.addComment, {
      variables: { bundleId },
      params,
      json: { comment: comment },
    })
      .execute()
      .then(() => {
        fetchTaskComments(primaryTaskId)(dispatch);
        fetchTask(primaryTaskId)(dispatch); // Refresh task data
      })
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          dispatch(addError(AppErrors.task.addCommentFailure));
          console.log(error.response || error);
        }
      });
  };
};

/**
 * Fetch task bundle with given id
 */
export const fetchTaskBundle = function (bundleId, lockTasks) {
  return function (dispatch) {
    return new Endpoint(api.tasks.fetchBundle, {
      variables: { bundleId },
      params: { lockTasks },
    })
      .execute()
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          dispatch(addError(AppErrors.task.bundleFailure));
          console.log(error.response || error);
        }
      });
  };
};

/**
 * Fetch comments for the given task
 */
export const fetchTaskComments = function (taskId) {
  return function (dispatch) {
    return new Endpoint(api.task.comments, {
      schema: [commentSchema()],
      variables: { id: taskId },
    })
      .execute()
      .then((normalizedComments) => {
        dispatch(receiveComments(normalizedComments.entities));

        if (_isObject(normalizedComments.entities.comments)) {
          // Inject comment ids into task
          dispatch(
            receiveTasks(
              simulatedEntities({
                id: taskId,
                comments: _map(_keys(normalizedComments.entities.comments), (id) =>
                  parseInt(id, 10),
                ),
              }),
            ),
          );
        }

        return normalizedComments;
      });
  };
};

/**
 * Fetch history for the given task
 */
export const fetchTaskHistory = function (taskId) {
  return function (dispatch) {
    return new Endpoint(api.task.history, {
      schema: {},
      variables: { id: taskId },
    })
      .execute()
      .then((normalizedHistory) => {
        if (_isObject(normalizedHistory.result)) {
          // Inject history into task
          dispatch(
            receiveTasks(
              simulatedEntities({
                id: taskId,
                history: _values(normalizedHistory.result),
              }),
            ),
          );
        }

        return normalizedHistory;
      })
      .catch((error) => {
        console.log(error);
      });
  };
};

/**
 * Retrieve a random task from the given challenge. If priorTaskId is given,
 * then an attempt will be made to retrieve a task geographically proximate to
 * the given task.
 *
 * If info on available mapillary images for the task is also desired, set
 * includeMapillary to true
 */
export const loadRandomTaskFromChallenge = function (
  challengeId,
  priorTaskId,
  includeMapillary = false,
) {
  return function (dispatch) {
    const endpoint = new Endpoint(api.challenge.prioritizedTask, {
      schema: [taskSchema()],
      variables: { id: challengeId },
      params: {
        proximity: Number.isFinite(priorTaskId) ? priorTaskId : undefined,
        mapillary: includeMapillary,
      },
    });

    return retrieveChallengeTask(dispatch, endpoint);
  };
};

/**
 * Retrieve a random task from the given virtual challenge. If priorTaskId is
 * given, then an attempt will be made to retrieve a task geographically
 * proximate to the given task.
 *
 * If info on available mapillary images for the task is also desired, set
 * includeMapillary to true
 */
export const loadRandomTaskFromVirtualChallenge = function (
  virtualChallengeId,
  priorTaskId,
  includeMapillary = false,
) {
  return function (dispatch) {
    return retrieveChallengeTask(
      dispatch,
      new Endpoint(api.virtualChallenge.randomTask, {
        schema: taskSchema(),
        variables: { id: virtualChallengeId },
        params: {
          proximity: Number.isFinite(priorTaskId) ? priorTaskId : undefined,
          mapillary: includeMapillary,
        },
      }),
    );
  };
};

/**
 * Retrieve the previous sequential task from the given challenge (primarily
 * intended for use during challenge inspect by challenge owners).
 */
export const loadPreviousSequentialTaskFromChallenge = function (challengeId, currentTaskId) {
  return function (dispatch) {
    return retrieveChallengeTask(
      dispatch,
      new Endpoint(api.challenge.previousSequentialTask, {
        schema: taskSchema(),
        variables: { challengeId: challengeId, taskId: currentTaskId },
      }),
    );
  };
};

/**
 * Retrieve the next sequential task from the given challenge (primarily intended
 * for use during challenge inspect by challenge owners).
 */
export const loadNextSequentialTaskFromChallenge = function (challengeId, currentTaskId) {
  return function (dispatch) {
    return retrieveChallengeTask(
      dispatch,
      new Endpoint(api.challenge.nextSequentialTask, {
        schema: taskSchema(),
        variables: { challengeId: challengeId, taskId: currentTaskId },
      }),
    );
  };
};

/**
 * Retrieve all tasks (up to the given limit) belonging to the given
 * challenge
 */
export const fetchChallengeTasks = function (challengeId, limit = 50) {
  return function (dispatch) {
    return new Endpoint(api.challenge.tasks, {
      schema: [taskSchema()],
      variables: { id: challengeId },
      params: { limit },
    })
      .execute()
      .then((normalizedResults) => {
        dispatch(receiveTasks(normalizedResults.entities));
        return normalizedResults;
      });
  };
};

/*
 * Retrieve tasks geographically closest to the given task (up to the given
 * limit) belonging to the given challenge or virtual challenge. Returns an
 * object in clusteredTasks format with the tasks and meta data, including the
 * challenge or virtual challenge id. Note that this does not add the results
 * to the redux store, but simply returns them
 */
export const fetchNearbyTasks = function (
  challengeId,
  isVirtualChallenge,
  taskId,
  excludeSelfLocked = false,
  limit = 5,
) {
  return function () {
    const params = { limit };
    if (excludeSelfLocked) {
      params.excludeSelfLocked = "true";
    }

    return new Endpoint(
      isVirtualChallenge ? api.virtualChallenge.nearbyTasks : api.challenge.nearbyTasks,
      {
        schema: [taskSchema()],
        variables: { challengeId, taskId },
        params,
      },
    )
      .execute()
      .then((normalizedResults) => ({
        challengeId,
        isVirtualChallenge,
        loading: false,
        tasks: _map(_values(normalizedResults?.entities?.tasks ?? {}), (task) => {
          if (task.location) {
            // match clusteredTasks response, which returns a point with lat/lng fields
            task.point = {
              lng: task.location.coordinates[0],
              lat: task.location.coordinates[1],
            };
          }

          return task;
        }),
      }));
  };
};

/**
 * Retrieve tasks geographically closest to the given task (up to the given
 * limit) belonging to the given challenge or virtual challenge. Returns an
 * object in clusteredTasks format with the tasks and meta data, including the
 * challenge or virtual challenge id. Note that this does not add the results
 * to the redux store, but simply returns them
 */
export const fetchNearbyTasksInBoundingBox = function (
  challengeId,
  isVirtualChallenge,
  taskId,
  excludeSelfLocked = false,
  boundingBox,
  limit = 5,
) {
  return function () {
    const params = { limit, taskId };
    if (excludeSelfLocked) {
      params.excludeSelfLocked = "true";
    }

    return new Endpoint(
      isVirtualChallenge
        ? api.virtualChallenge.nearbyTasksWithinBoundingBox
        : api.challenge.nearbyTasksWithinBoundingBox,
      {
        schema: [taskSchema()],
        variables: {
          challengeId,
          left: boundingBox[0],
          bottom: boundingBox[1],
          right: boundingBox[2],
          top: boundingBox[3],
        },
        params,
      },
    )
      .execute()
      .then((normalizedResults) => ({
        challengeId,
        isVirtualChallenge,
        loading: false,
        tasks: _map(_values(normalizedResults?.entities?.tasks ?? {}), (task) => {
          if (task.location) {
            // match clusteredTasks response, which returns a point with lat/lng fields
            task.point = {
              lng: task.location.coordinates[0],
              lat: task.location.coordinates[1],
            };
          }

          return task;
        }),
      }));
  };
};

/**
 * Initiate deletion of tasks in the given statuses belonging to the given
 * challenge. Note that this does not wait until the tasks have been deleted
 * before resolving.
 */
export const deleteChallengeTasks = function (challengeId, statuses = null) {
  return new Endpoint(api.challenge.deleteTasks, {
    variables: { id: challengeId },
    params: statuses ? { statusFilters: statuses.join(",") } : undefined,
  }).execute();
};

/**
 * Set the given status on the given task
 * @private
 */
const updateTaskStatus = function (
  dispatch,
  taskId,
  newStatus,
  requestReview = null,
  tags = null,
  cooperativeWorkSummary = null,
  osmComment = null,
  completionResponses = null,
) {
  // Optimistically assume request will succeed. The store will be updated
  // with fresh task data from the server if the save encounters an error.
  dispatch(
    receiveTasks(
      simulatedEntities({
        id: taskId,
        status: newStatus,
      }),
    ),
  );

  const params = {};
  if (requestReview != null) {
    params.requestReview = requestReview;
  }

  if (tags != null) {
    params.tags = tags;
  }

  let endpoint = null;
  // Completed cooperative work goes to a different endpoint
  if (cooperativeWorkSummary && newStatus === TaskStatus.fixed) {
    endpoint = new Endpoint(api.task.applyTagFix, {
      params,
      variables: { id: taskId },
      json: {
        comment: osmComment,
        changes: cooperativeWorkSummary,
      },
    });
  } else {
    endpoint = new Endpoint(api.task.updateStatus, {
      schema: taskSchema(),
      variables: { id: taskId, status: newStatus },
      params,
      json: completionResponses,
    });
  }

  return endpoint.execute().catch((error) => {
    if (isSecurityError(error)) {
      dispatch(ensureUserLoggedIn()).then(() => dispatch(addError(AppErrors.user.unauthorized)));
    } else {
      dispatch(addError(AppErrors.task.updateFailure));
      console.log(error.response || error);
    }
    fetchTask(taskId)(dispatch); // Fetch accurate task data
  });
};

/**
 * Set the given status on the tasks in the given bundle
 * @private
 */
const updateBundledTasksStatus = function (
  dispatch,
  bundleId,
  primaryTaskId,
  newStatus,
  requestReview = null,
  tags = null,
  cooperativeWorkSummary = null,
  osmComment,
  completionResponses = null,
) {
  if (cooperativeWorkSummary) {
    throw new Error("Cooperative tasks cannot be updated as a bundle at this time");
  }

  const params = {
    primaryId: primaryTaskId,
  };

  if (requestReview != null) {
    params.requestReview = requestReview;
  }

  if (tags != null) {
    params.tags = tags;
  }

  const endpoint = new Endpoint(api.tasks.bundled.updateStatus, {
    schema: taskBundleSchema(),
    variables: { bundleId, status: newStatus },
    params,
    json: completionResponses,
  });

  return endpoint.execute().catch((error) => {
    if (isSecurityError(error)) {
      dispatch(ensureUserLoggedIn()).then(() => dispatch(addError(AppErrors.user.unauthorized)));
    } else {
      dispatch(addError(AppErrors.task.updateFailure));
      console.log(error.response || error);
    }
    fetchTask(primaryTaskId)(dispatch); // Fetch accurate task data
  });
};

export const fetchCooperativeTagFixChangeset = function (cooperativeWorkSummary) {
  const endpoint = new Endpoint(api.task.testTagFix, {
    params: { changeType: "osmchange" },
    json: cooperativeWorkSummary,
    expectXMLResponse: true,
  });

  return endpoint.execute();
};

/**
 * Retrieve the place description associated with the task in the
 * given results.
 *
 * > Note that if the results contain multiple tasks, only the
 * > place description of the first result is retrieved.
 */
export const fetchTaskPlace = function (task) {
  return function (dispatch) {
    return dispatch(
      fetchPlace(task?.location?.coordinates?.[1] ?? 0, task?.location?.coordinates?.[0] ?? 0),
    ).then((normalizedPlaceResults) => {
      // Tasks have no natural reference to places, so inject the place id into
      // the task so that later denormalization will work properly.
      return dispatch(
        receiveTasks(
          simulatedEntities({
            id: task.id,
            place: normalizedPlaceResults?.result,
          }),
        ),
      );
    });
  };
};

/**
 * Update the tags on the task.
 *
 */
export const updateTaskTags = function (taskId, tags) {
  return function (dispatch) {
    return new Endpoint(api.task.updateTags, {
      schema: {},
      variables: { id: taskId },
      params: { tags: tags },
    })
      .execute()
      .then((normalizedTags) => {
        if (_isObject(normalizedTags.result)) {
          // Inject tags into task.
          dispatch(
            receiveTasks(
              simulatedEntities({
                id: taskId,
                tags: _values(normalizedTags.result),
              }),
            ),
          );
        }
        return normalizedTags;
      });
  };
};

/**
 * Saves the given task (either creating it or updating it, depending on
 * whether it already has an id) and updates the redux store with the latest
 * version from the server.
 */
export const saveTask = function (originalTaskData) {
  return function (dispatch) {
    const taskData = _pick(originalTaskData, [
      "id",
      "name",
      "instruction",
      "geometries",
      "status",
      "priority",
      "tags",
    ]);

    // If the geometries are a string, convert to JSON.
    if (_isString(taskData.geometries)) {
      taskData.geometries = JSON.parse(taskData.geometries);
    }

    // Setup the save function to either edit or create the task
    // depending on whether it has an id.
    const saveEndpoint = new Endpoint(
      Number.isFinite(taskData.id) ? api.task.edit : api.task.create,
      {
        schema: taskSchema(),
        variables: { id: taskData.id },
        json: taskData,
      },
    );

    return saveEndpoint
      .execute()
      .then((normalizedResults) => {
        dispatch(receiveTasks(normalizedResults.entities));
        return normalizedResults?.entities?.tasks?.[normalizedResults.result];
      })
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          console.log(error.response || error);
          dispatch(addServerError(AppErrors.task.saveFailure, error));
        }
      });
  };
};

/**
 * Deletes the given task from the server.
 */
export const deleteTask = function (taskId) {
  return function (dispatch) {
    return new Endpoint(api.task.delete, { variables: { id: taskId } })
      .execute()
      .then(() => dispatch(removeTask(taskId)))
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          dispatch(addError(AppErrors.task.deleteFailure));
          console.log(error.response || error);
        }
      });
  };
};

export const bundleTasks = function (primaryId, taskIds, bundleName = "") {
  return function (dispatch) {
    return new Endpoint(api.tasks.bundle, {
      json: { name: bundleName, primaryId, taskIds },
    })
      .execute()
      .then((results) => {
        return results;
      })
      .catch(async (error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          const errorMessage = await error.response.text();
          if (errorMessage.includes("already assigned to bundle")) {
            const numberPattern = /\d+/;
            const matchedNumber = errorMessage.match(numberPattern);
            if (matchedNumber) {
              const taskId = parseInt(matchedNumber[0]);
              dispatch(addErrorWithDetails(AppErrors.task.taskAlreadyBundled, [taskId]));
            } else {
              console.log("No task ID found in the error message.");
            }
          }
          if (errorMessage.includes("task IDs were locked")) {
            const numberPattern = /\d+/g;
            const matchedNumbers = errorMessage.match(numberPattern);
            if (matchedNumbers) {
              const numbersOnly = matchedNumbers.map(Number);
              dispatch(addErrorWithDetails(AppErrors.task.unableToBundleTasks, numbersOnly));
            } else {
              console.log("No task IDs found in the error message.");
            }
          }
          dispatch(addError(AppErrors.task.bundleFailure));
          console.log(error.response || error);
        }
      });
  };
};

export const updateTaskBundle = function (initialBundle, taskIds) {
  const params = { taskIds: taskIds };
  const bundleId = initialBundle.bundleId;

  // Find tasks that were removed from the bundle
  const removedTaskIds = initialBundle.taskIds.filter((id) => !taskIds.includes(id));

  return function (dispatch) {
    return new Endpoint(api.tasks.updateBundle, {
      variables: { bundleId },
      params,
    })
      .execute()
      .then((results) => {
        // Dispatch remove action for each removed task
        removedTaskIds.forEach((taskId) => {
          dispatch(removeTaskFromBundle(taskId));
        });
        return results;
      })
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          dispatch(addError(AppErrors.task.bundleFailure));
          console.log(error.response || error);
        }
      });
  };
};

export const deleteTaskBundle = function (bundleId) {
  return function (dispatch) {
    return new Endpoint(api.tasks.deleteBundle, {
      variables: { bundleId },
    })
      .execute()
      .then(() => {
        // After successful deletion, clear the bundleId from tasks
        dispatch(clearTaskBundle(bundleId));
      })
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          dispatch(addError(AppErrors.task.bundleFailure));
          console.log(error.response || error);
        }
      });
  };
};

/**
 * Retrieve and process a single task retrieval from the given endpoint (next
 * task, previous task, random task, etc).
 *
 * @private
 */
export const retrieveChallengeTask = function (dispatch, endpoint) {
  return endpoint
    .execute()
    .then((normalizedTaskResults) => {
      if (
        !normalizedTaskResults ||
        (!Number.isFinite(normalizedTaskResults.result) && _isEmpty(normalizedTaskResults.result))
      ) {
        return null;
      }

      const retrievedTaskId = Array.isArray(normalizedTaskResults.result)
        ? normalizedTaskResults.result[0]
        : normalizedTaskResults.result;

      if (retrievedTaskId !== undefined) {
        // Some API requests give back the parent as `parentId` instead
        // of `parent`, and the geometries back as `geometry` instead of
        // `geometries`. Normalize these.
        const taskEntity = normalizedTaskResults.entities.tasks[retrievedTaskId];
        if (!Number.isFinite(taskEntity.parent)) {
          taskEntity.parent = taskEntity.parentId;
        }

        if (!_isObject(taskEntity.geometries)) {
          taskEntity.geometries = taskEntity.geometry;
        }

        dispatch(receiveTasks(normalizedTaskResults.entities));

        // Kick off fetches of supplementary data, but don't wait for them.
        fetchTaskPlace(normalizedTaskResults.entities.tasks[retrievedTaskId])(dispatch);

        fetchTaskComments(retrievedTaskId)(dispatch);

        return taskEntity;
      }
    })
    .catch((error) => {
      dispatch(addError(AppErrors.task.fetchFailure));
      console.log(error.response || error);
      throw error;
    });
};

/**
 * Builds a simulated normalized entities representation from the given task
 *
 * @private
 */
export const simulatedEntities = function (task) {
  return {
    tasks: {
      [task.id]: task,
    },
  };
};

/**
 * reduceTasksFurther will be invoked by the genericEntityReducer function to
 * perform additional reduction on challenge entities.
 *
 * @private
 */
const reduceTasksFurther = function (mergedState, oldState, taskEntities) {
  // The generic reduction will merge arrays and objects, but for some fields
  // we want to simply overwrite with the latest data.
  for (const entity of taskEntities) {
    if (Array.isArray(entity.tags)) {
      mergedState[entity.id].tags = entity.tags;
    }
  }
};

// redux reducers
export const taskEntities = function (state, action) {
  if (action.type === REMOVE_TASK) {
    const mergedState = _cloneDeep(state);
    delete mergedState[action.taskId];
    return mergedState;
  } else if (action.type === CLEAR_TASKS) {
    return _remove(_cloneDeep(state), (x) => (x ? x.parent === action.challengeId : false));
  } else if (action.type === CLEAR_TASK_BUNDLE) {
    // Instead of removing tasks, update them to remove their bundle association
    const mergedState = _cloneDeep(state);
    Object.keys(mergedState).forEach((taskId) => {
      if (mergedState[taskId] && mergedState[taskId].bundleId === action.bundleId) {
        mergedState[taskId].bundleId = null;
        mergedState[taskId].isBundlePrimary = null;
      }
    });
    return mergedState;
  } else if (action.type === REMOVE_TASK_FROM_BUNDLE) {
    const mergedState = _cloneDeep(state);
    if (mergedState[action.taskId]) {
      mergedState[action.taskId].bundleId = null;
    }
    return mergedState;
  } else {
    return genericEntityReducer(RECEIVE_TASKS, "tasks", reduceTasksFurther)(state, action);
  }
};

/**
 * Request unlock for the given taskId
 */
export const requestUnlock = function (taskId) {
  return function (dispatch) {
    return new Endpoint(api.task.requestUnlock, {
      variables: { id: taskId },
    })
      .execute()
      .then(() => ({ message: "success" }))
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          dispatch(addError(AppErrors.task.unlockFailure));
          console.log(error.response || error);
        }
      });
  };
};
