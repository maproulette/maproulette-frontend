import _cloneDeep from "lodash/cloneDeep";
import _join from "lodash/join";
import _map from "lodash/map";
import _set from "lodash/set";
import _snakeCase from "lodash/snakeCase";
import _values from "lodash/values";
import queryString from "query-string";
import { v1 as uuidv1 } from "uuid";
import uuidTime from "uuid-time";
import { challengeSchema } from "../../Challenge/Challenge";
import AppErrors from "../../Error/AppErrors";
import { addError } from "../../Error/Error";
import { PARAMS_MAP, generateSearchParametersString } from "../../Search/Search";
import Endpoint from "../../Server/Endpoint";
import RequestStatus from "../../Server/RequestStatus";
import { defaultRoutes as api, isSecurityError } from "../../Server/Server";
import { ensureUserLoggedIn } from "../../User/User";
import {
  fetchTask,
  receiveTasks,
  retrieveChallengeTask,
  taskBundleSchema,
  taskSchema,
} from "../Task";
import { RECEIVE_REVIEW_NEEDED_TASKS } from "./TaskReviewNeeded";
import {
  RECEIVE_MAPPER_REVIEWED_TASKS,
  RECEIVE_REVIEWED_BY_USER_TASKS,
  RECEIVE_REVIEWED_TASKS,
} from "./TaskReviewed";

export const MARK_REVIEW_DATA_STALE = "MARK_REVIEW_DATA_STALE";

export const REVIEW_TASKS_TO_BE_REVIEWED = "tasksToBeReviewed";
export const MY_REVIEWED_TASKS = "myReviewedTasks";
export const REVIEW_TASKS_BY_ME = "tasksReviewedByMe";
export const ALL_REVIEWED_TASKS = "allReviewedTasks";
export const META_REVIEW_TASKS = "metaReviewTasks";

export const ReviewTasksType = {
  toBeReviewed: REVIEW_TASKS_TO_BE_REVIEWED,
  myReviewedTasks: MY_REVIEWED_TASKS,
  reviewedByMe: REVIEW_TASKS_BY_ME,
  allReviewedTasks: ALL_REVIEWED_TASKS,
  metaReviewTasks: META_REVIEW_TASKS,
};

// redux action creators
export const RECEIVE_REVIEW_METRICS = "RECEIVE_REVIEW_METRICS";
export const RECEIVE_REVIEW_TAG_METRICS = "RECEIVE_REVIEW_TAG_METRICS";
export const RECEIVE_REVIEW_CLUSTERS = "RECEIVE_REVIEW_CLUSTERS";
export const RECEIVE_REVIEW_CHALLENGES = "RECEIVE_REVIEW_CHALLENGES";
export const RECEIVE_REVIEW_PROJECTS = "RECEIVE_REVIEW_PROJECTS";

const handleExposeError = (error, dispatch) => {
  dispatch(ensureUserLoggedIn()).then(async () => {
    const responseBody = await error.response.json();
    const message =
      responseBody.status === "Forbidden"
        ? { id: "Server", defaultMessage: responseBody.message }
        : AppErrors.user.unauthorized;
    dispatch(addError(message));
  });
};

/**
 * Mark the current review data as stale, meaning the app has been
 * informed or detected that updated task-review data is available
 * from the server
 */
export const markReviewDataStale = function () {
  return {
    type: MARK_REVIEW_DATA_STALE,
  };
};

/**
 * Add or replace the review metrics in the redux store
 */
export const receiveReviewMetrics = function (metrics, status = RequestStatus.success) {
  return {
    type: RECEIVE_REVIEW_METRICS,
    status,
    metrics,
    receivedAt: Date.now(),
  };
};

/**
 * Add or replace the review metrics in the redux store
 */
export const receiveReviewTagMetrics = function (tagMetrics, status = RequestStatus.success) {
  return {
    type: RECEIVE_REVIEW_TAG_METRICS,
    status,
    tagMetrics,
    receivedAt: Date.now(),
  };
};

/**
 * Add or replace the review clusters in the redux store
 */
export const receiveReviewClusters = function (clusters, status = RequestStatus.success, fetchId) {
  return {
    type: RECEIVE_REVIEW_CLUSTERS,
    status,
    clusters,
    receivedAt: Date.now(),
    fetchId,
  };
};

/**
 * Add or replace the review challenges in the redux store
 */
export const receiveReviewChallenges = function (
  reviewChallenges,
  status = RequestStatus.success,
  fetchId,
) {
  return {
    type: RECEIVE_REVIEW_CHALLENGES,
    status,
    reviewChallenges,
    receivedAt: Date.now(),
    fetchId,
  };
};

/**
 * Add or replace the review projects in the redux store
 */
export const receiveReviewProjects = function (
  reviewProjects,
  status = RequestStatus.success,
  fetchId,
) {
  return {
    type: RECEIVE_REVIEW_PROJECTS,
    status,
    reviewProjects,
    receivedAt: Date.now(),
    fetchId,
  };
};

// utility functions
/**
 * Builds a link to export CSV
 */
export const buildLinkToMapperExportCSV = function (criteria) {
  const queryFilters = generateReviewSearch(criteria);

  return `${window.env.REACT_APP_MAP_ROULETTE_SERVER_URL}/api/v2/tasks/review/mappers/export?${queryString.stringify(queryFilters)}`;
};

export const buildLinkToReviewTableExportCSV = function (criteria, addedColumns) {
  const queryFilters = buildQueryFilters(criteria, addedColumns);

  return `${window.env.REACT_APP_MAP_ROULETTE_SERVER_URL}/api/v2/tasks/review/reviewTable/export?${queryFilters}`;
};

export const buildLinkToReviewerMetaExportCSV = function (criteria) {
  const queryFilters = generateReviewSearch(criteria);

  return `${window.env.REACT_APP_MAP_ROULETTE_SERVER_URL}/api/v2/tasks/metareview/reviewers/export?${queryString.stringify(queryFilters)}`;
};

export const buildLinkTaskReviewHistoryCSV = function (challengeId) {
  return `${window.env.REACT_APP_MAP_ROULETTE_SERVER_URL}/api/v2/challenge/${challengeId}/extractReviewHistory`;
};

const generateReviewSearch = function (
  criteria = {},
  reviewTasksType = ReviewTasksType.allReviewedTasks,
  userId,
) {
  const searchParameters = generateSearchParametersString(
    criteria?.filters ?? {},
    criteria.boundingBox,
    criteria?.savedChallengesOnly,
    criteria?.excludeOtherReviewers,
    null,
    criteria?.invertFields ?? {},
  );

  const mappers = reviewTasksType === ReviewTasksType.myReviewedTasks ? [userId] : [];
  const reviewers = reviewTasksType === ReviewTasksType.reviewedByMe ? [userId] : [];

  return { ...searchParameters, mappers, reviewers };
};

const buildQueryFilters = function (criteria, addedColumns) {
  //Sort criteria filtering
  const sortCriteria = criteria?.sortCriteria ?? {};
  const direction = sortCriteria.direction;
  let sortBy = sortCriteria.sortBy; //Set and fix sort by values
  sortBy = sortBy == "mappedOn" ? "mapped_on" : sortBy;
  sortBy = sortBy == "id" ? "tasks.id" : sortBy;
  sortBy = sortBy == "reviewStatus" ? "review_status" : sortBy;
  sortBy = sortBy == "reviewedAt" ? "reviewed_at" : sortBy;
  sortBy = sortBy == "metaReviewedAt" ? "meta_reviewed_at" : sortBy;

  //Main Filters
  const filters = criteria?.filters ?? {};
  const taskId = filters.id;
  const featureId = filters.featureId;
  const challengeId = filters.challengeId;
  const projectId = filters.projectId;
  const reviewedAt = filters.reviewedAt;
  const mappedOn = filters.mappedOn;
  const reviewRequestedBy = filters.reviewRequestedBy;
  const reviewedBy = filters.reviewedBy;
  const metaReviewedBy = filters.metaReviewedBy;

  //inverted filters
  let invertedFilters = _map(criteria.invertFields, (v, k) => (v ? PARAMS_MAP[k] : undefined));

  //fix invertedFilters values
  invertedFilters = invertedFilters.map((e) => (e === "tp" ? "priorities" : e));
  invertedFilters = invertedFilters.map((e) => (e === "o" ? "m" : e));
  invertedFilters = invertedFilters.map((e) => (e === "cs" ? "cid" : e));
  invertedFilters = invertedFilters.map((e) => (e === "ps" ? "pid" : e));

  //Fixes mappedOn Formatting Data
  let timestamp = "";
  if (mappedOn) {
    const date = new Date(filters.mappedOn);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = String(date.getFullYear());
    timestamp = `${year}-${month}-${day}`;
  }

  //Sets initial value of these parameters to negate their "all" value
  let status = ["0", "1", "2", "3", "4", "5", "6", "9"];
  let reviewStatus = ["0", "1", "2", "3", "4", "5", "6", "7", "-1"];
  let priority = ["0", "1", "2"];
  let metaReviewStatus = ["-2", "0", "1", "2", "3", "6"];

  //add configuration to remove inverting on the "all" value
  function removeValueFromArray(arr, value) {
    return arr.filter((e) => e !== value);
  }
  //add configuration to replace the value "all" with the needed equivalent values
  //remove inversion if values are equal to "all"
  if (filters.status != "all" && filters.status != undefined) {
    status = JSON.stringify(filters.status);
  } else if (filters.status == "all" || filters.status == undefined) {
    invertedFilters = removeValueFromArray(invertedFilters, "tStatus");
  }
  if (filters.reviewStatus != "all" && filters.reviewStatus != undefined) {
    reviewStatus = JSON.stringify(filters.reviewStatus);
  } else if (filters.reviewStatus == "all" || filters.reviewStatus == undefined) {
    invertedFilters = removeValueFromArray(invertedFilters, "trStatus");
  }
  if (filters.priority != "all" && filters.priority != undefined) {
    priority = JSON.stringify(filters.priority);
  } else if (filters.priority == "all" || filters.priority == undefined) {
    invertedFilters = removeValueFromArray(invertedFilters, "priorities");
  }
  if (filters.metaReviewStatus != "all" && filters.metaReviewStatus != undefined) {
    metaReviewStatus = JSON.stringify(filters.metaReviewStatus);
  } else if (filters.metaReviewStatus == "all" || filters.metaReviewStatus == undefined) {
    invertedFilters = removeValueFromArray(invertedFilters, "mrStatus");
  }

  //Holds the displayed column names and their order
  let displayedColumns = Object.keys(addedColumns).map((key) => {
    const capitalizedKey = key.replace(/([A-Z])/g, " $1").trim();
    return capitalizedKey.charAt(0).toUpperCase() + capitalizedKey.slice(1);
  });
  //Fix Headers
  displayedColumns = displayedColumns.map((e) => (e === "Id" ? "Internal Id" : e));
  displayedColumns = displayedColumns.map((e) => (e === "Mapper Controls" ? "Actions" : e));
  displayedColumns = displayedColumns.map((e) => (e === "Reviewer Controls" ? "Actions" : e));
  displayedColumns = displayedColumns.map((e) => (e === "Review Requested By" ? "Mapper" : e));
  displayedColumns = displayedColumns.map((e) => (e === "Reviewed By" ? "Reviewer" : e));
  displayedColumns = displayedColumns.map((e) => (e === "Reviewed At" ? "Reviewed On" : e));
  displayedColumns = removeValueFromArray(displayedColumns, "View Comments");
  displayedColumns = removeValueFromArray(displayedColumns, "Tags");

  return (
    `${taskId ? `taskId=${taskId}` : ""}` +
    `${featureId ? `&featureId=${featureId}` : ""}` +
    `&reviewStatus=${_join(reviewStatus, ",")}` +
    `${reviewRequestedBy ? `&mapper=${reviewRequestedBy}` : ""}` +
    `${challengeId ? `&challengeId=${challengeId}` : ""}` +
    `${projectId ? `&projectIds=${projectId}` : ""}` +
    `${mappedOn ? `&mappedOn=${timestamp}` : ""}` +
    `${reviewedBy ? `&reviewedBy=${reviewedBy}` : ""}` +
    `${reviewedAt ? `&reviewedAt=${reviewedAt}` : ""}` +
    `${metaReviewedBy ? `&metaReviewedBy=${metaReviewedBy}` : ""}` +
    `&metaReviewStatus=${_join(metaReviewStatus, ",")}&` +
    `&status=${_join(status, ",")}&` +
    `&priority=${_join(priority, ",")}&` +
    `${sortBy ? `&sortBy=${sortBy}` : ""}` +
    `${direction ? `&direction=${direction}` : ""}` +
    `${displayedColumns ? `&displayedColumns=${displayedColumns}` : ""}` +
    `&invertedFilters=${invertedFilters.join(",")}`
  );
};

/**
 * Retrieve metrics for a given review tasks type and filter criteria
 */
export const fetchReviewMetrics = function (userId, reviewTasksType, criteria) {
  const type = determineType(reviewTasksType);
  const params = generateReviewSearch(criteria, reviewTasksType, userId);

  return function (dispatch) {
    return new Endpoint(api.tasks.reviewMetrics, {
      params: {
        reviewTasksType: type,
        ...params,
        includeByPriority: true,
        includeByTaskStatus: true,
      },
    })
      .execute()
      .then((normalizedResults) => {
        dispatch(receiveReviewMetrics(normalizedResults, RequestStatus.success));
        return normalizedResults;
      })
      .catch((error) => {
        console.log(error.response || error);
      });
  };
};

/**
 * Retrieve metrics for a given review tasks type and filter criteria
 */
export const fetchReviewTagMetrics = function (userId, reviewTasksType, criteria) {
  const type = determineType(reviewTasksType);
  const params = generateReviewSearch(criteria, reviewTasksType, userId);

  return function (dispatch) {
    return new Endpoint(api.tasks.reviewTagMetrics, {
      schema: null,
      params: { reviewTasksType: type, ...params },
    })
      .execute()
      .then((normalizedResults) => {
        dispatch(receiveReviewTagMetrics(normalizedResults, RequestStatus.success));
        return normalizedResults;
      })
      .catch((error) => {
        console.log(error.response || error);
      });
  };
};

/**
 * Retrieve clustered tasks for given review criteria
 */
export const fetchClusteredReviewTasks = function (reviewTasksType, criteria = {}) {
  const searchParameters = generateSearchParametersString(
    criteria?.filters ?? {},
    criteria.boundingBox,
    criteria?.savedChallengesOnly,
    criteria?.excludeOtherReviewers,
    null,
    criteria?.invertFields ?? {},
  );
  return function (dispatch) {
    if (window.env.REACT_APP_DISABLE_TASK_CLUSTERS === "true") {
      return new Promise((resolve) => resolve());
    }

    const type = determineType(reviewTasksType);
    const fetchId = uuidv1();

    dispatch(receiveReviewClusters({}, RequestStatus.inProgress, fetchId));
    return new Endpoint(api.tasks.fetchReviewClusters, {
      schema: { tasks: [taskSchema()] },
      params: { reviewTasksType: type, points: 25, ...searchParameters },
    })
      .execute()
      .then((normalizedResults) => {
        if (normalizedResults.result) {
          dispatch(receiveReviewClusters(normalizedResults.result, RequestStatus.success, fetchId));
        }

        return normalizedResults.result;
      })
      .catch((error) => {
        dispatch(receiveReviewClusters({}, RequestStatus.error, fetchId));
        console.log(error.response || error);
      });
  };
};

const determineType = (reviewTasksType) => {
  switch (reviewTasksType) {
    case ReviewTasksType.toBeReviewed:
      return 1;
    case ReviewTasksType.reviewedByMe:
      return 2;
    case ReviewTasksType.myReviewedTasks:
      return 3;
    case ReviewTasksType.allReviewedTasks:
      return 4;
    case ReviewTasksType.metaReviewTasks:
    default:
      return 5;
  }
};

/*
 * Retrieve review tasks geographically closest to the given task (up to the given
 * limit). Returns an object in clusteredTasks format with the tasks and meta data.
 * Note that this does not add the results to the redux store, but simply returns them
 */
export const fetchNearbyReviewTasks = function (
  taskId,
  criteria = {},
  limit = 5,
  asMetaReview = false,
) {
  return function () {
    const searchParameters = generateSearchParametersString(
      criteria?.filters ?? {},
      criteria.boundingBox,
      criteria?.savedChallengesOnly,
      criteria?.excludeOtherReviewers,
      null,
      criteria?.invertFields ?? {},
    );

    const params = { limit, ...searchParameters, asMetaReview };

    return new Endpoint(api.tasks.nearbyReviewTasks, {
      schema: [taskSchema()],
      variables: { taskId },
      params,
    })
      .execute()
      .then((normalizedResults) => ({
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
 * Retrieve the next task to review with the given sort and filter criteria
 */
export const loadNextReviewTask = function (criteria = {}, lastTaskId, asMetaReview) {
  const sortBy = criteria?.sortCriteria?.sortBy;
  const order = (criteria?.sortCriteria?.direction || "DESC").toUpperCase();
  const sort = sortBy ? `${_snakeCase(sortBy)}` : null;
  const searchParameters = generateSearchParametersString(
    criteria?.filters ?? {},
    criteria.boundingBox,
    criteria?.savedChallengesOnly,
    criteria?.excludeOtherReviewers,
    null,
    criteria?.invertFields ?? {},
  );

  return function (dispatch) {
    const params = { sort, order, ...searchParameters, asMetaReview, includeTags: true };
    if (Number.isFinite(lastTaskId)) {
      params.lastTaskId = lastTaskId;
    }

    return retrieveChallengeTask(
      dispatch,
      new Endpoint(api.tasks.reviewNext, {
        schema: taskSchema(),
        variables: {},
        params,
      }),
    );
  };
};

/**
 * Fetch data for the given task and claim it for review.
 *
 * If info on available mapillary images for the task is also desired, set
 * includeMapillary to true
 */
export const fetchTaskForReview = function (taskId, includeMapillary = false) {
  return function (dispatch) {
    return new Endpoint(api.task.startReview, {
      schema: taskSchema(),
      variables: { id: taskId },
      params: { mapillary: includeMapillary, includeTags: true },
    })
      .execute()
      .then((normalizedResults) => {
        dispatch(receiveTasks(normalizedResults.entities));
        return normalizedResults;
      });
  };
};

/**
 * Remove the task review claim on this task.
 */
export const cancelReviewClaim = function (taskId) {
  return function (dispatch) {
    return new Endpoint(api.task.cancelReview, { schema: taskSchema(), variables: { id: taskId } })
      .execute()
      .then((normalizedResults) => {
        // Server doesn't explicitly return empty fields from JSON.
        // This field should now be null so we will set it so when the
        // task data is merged with existing task data it will be correct.
        normalizedResults.entities.tasks[taskId].reviewClaimedBy = null;
        dispatch(receiveTasks(normalizedResults.entities));
        return normalizedResults;
      })
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          console.log(error.response || error);
        }
        fetchTask(taskId)(dispatch); // Fetch accurate task data
      });
  };
};

export const removeReviewRequest = function (
  challengeId,
  taskIds,
  criteria,
  excludeTaskIds,
  asMetaReview,
) {
  return function (dispatch) {
    const filters = criteria?.filters ?? {};
    const searchParameters = !criteria
      ? {}
      : generateSearchParametersString(
          filters,
          criteria.boundingBox,
          null,
          null,
          criteria.searchQuery,
          criteria.invertFields,
          excludeTaskIds,
        );
    searchParameters.cid = challengeId;
    if (taskIds) {
      searchParameters.ids = taskIds.join(",");
    }

    return new Endpoint(api.tasks.removeReviewRequest, {
      params: { ...searchParameters, asMetaReview },
      json: filters.taskPropertySearch ? { taskPropertySearch: filters.taskPropertySearch } : null,
    })
      .execute()
      .catch((error) => {
        if (isSecurityError(error)) {
          handleExposeError(error, dispatch);
        } else {
          dispatch(addError(AppErrors.task.updateFailure));
          console.log(error.response || error);
        }
      });
  };
};

/**
 *
 */
export const completeReview = function (
  taskId,
  taskReviewStatus,
  comment,
  tags,
  newTaskStatus,
  asMetaReview = false,
  errorTags,
) {
  return function (dispatch) {
    return updateTaskReviewStatus(
      dispatch,
      taskId,
      taskReviewStatus,
      comment,
      tags,
      newTaskStatus,
      asMetaReview,
      errorTags,
    );
  };
};

export const completeBundleReview = function (
  bundleId,
  taskReviewStatus,
  comment,
  tags,
  newTaskStatus,
  asMetaReview = false,
  errorTags,
) {
  return function (dispatch) {
    return new Endpoint(
      asMetaReview
        ? api.tasks.bundled.updateMetaReviewStatus
        : api.tasks.bundled.updateReviewStatus,
      {
        schema: taskBundleSchema(),
        variables: { bundleId, status: taskReviewStatus },
        params: {
          tags,
          newTaskStatus,
          asMetaReview,
          errorTags: errorTags ? errorTags.join(",") : undefined,
        },
        json: { comment: comment },
      },
    )
      .execute()
      .catch((error) => {
        if (isSecurityError(error)) {
          handleExposeError(error, dispatch);
        } else {
          dispatch(addError(AppErrors.task.updateFailure));
          console.log(error.response || error);
        }
      });
  };
};

/**
 * Updates the completion status of a task being reviewed, leaving its review
 * status untouched. Credit for the task stays with the original mapper.
 */
export const updateTaskCompletionStatus = function (taskId, newTaskStatus) {
  return function (dispatch) {
    return new Endpoint(api.task.updateCompletionStatus, {
      schema: taskSchema(),
      variables: { id: taskId, status: newTaskStatus },
    })
      .execute()
      .then((normalizedResults) => {
        dispatch(receiveTasks(normalizedResults.entities));
        return normalizedResults;
      })
      .catch((error) => {
        if (isSecurityError(error)) {
          handleExposeError(error, dispatch);
        } else {
          dispatch(addError(AppErrors.task.updateFailure));
          console.log(error.response || error);
        }

        fetchTask(taskId)(dispatch);
        throw error;
      });
  };
};

/**
 * Fetches a list of challenges which have review tasks
 */
export const fetchReviewChallenges = function (
  reviewTasksType,
  includeTaskStatuses = null,
  excludeOtherReviewers = true,
) {
  return function (dispatch) {
    const type = determineType(reviewTasksType);

    const tStatus = includeTaskStatuses ? includeTaskStatuses.join(",") : "";

    return new Endpoint(api.challenges.withReviewTasks, {
      schema: [challengeSchema()],
      params: { reviewTasksType: type, excludeOtherReviewers, tStatus, limit: -1 },
    })
      .execute()
      .then((normalizedResults) => {
        dispatch(
          receiveReviewChallenges(normalizedResults.entities.challenges, RequestStatus.success),
        );
        dispatch(receiveReviewProjects(normalizedResults.entities.projects, RequestStatus.success));

        return normalizedResults;
      })
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          dispatch(addError(AppErrors.challenge.fetchFailure));
          console.log(error.response || error);
        }
      });
  };
};

const updateTaskReviewStatus = function (
  dispatch,
  taskId,
  newStatus,
  comment,
  tags,
  newTaskStatus,
  asMetaReview,
  errorTags,
) {
  // Optimistically assume request will succeed. The store will be updated
  // with fresh task data from the server if the save encounters an error.
  dispatch(
    receiveTasks({
      tasks: {
        [taskId]: {
          id: taskId,
          reviewStatus: newStatus,
        },
      },
    }),
  );
  return new Endpoint(
    asMetaReview ? api.task.updateMetaReviewStatus : api.task.updateReviewStatus,
    {
      schema: taskSchema(),
      variables: { id: taskId, status: newStatus },
      params: {
        tags: tags,
        newTaskStatus: newTaskStatus,
        errorTags: errorTags ? errorTags.join(",") : undefined,
      },
      json: { comment: comment },
    },
  )
    .execute()
    .catch((error) => {
      if (isSecurityError(error)) {
        handleExposeError(error, dispatch);
      } else {
        dispatch(addError(AppErrors.task.updateFailure));
        console.log(error.response || error);
      }
      fetchTask(taskId)(dispatch); // Fetch accurate task data
    });
};

// redux reducers
export const currentReviewTasks = function (state = {}, action) {
  let updatedState = null;

  switch (action.type) {
    case MARK_REVIEW_DATA_STALE:
      updatedState = _cloneDeep(state);
      _set(updatedState, "reviewNeeded.dataStale", true);
      _set(updatedState, "reviewed.dataStale", true);
      _set(updatedState, "reviewedByUser.dataStale", true);
      return updatedState;
    case RECEIVE_REVIEWED_TASKS:
      return updateReduxState(state, action, "reviewed");
    case RECEIVE_MAPPER_REVIEWED_TASKS:
      return updateReduxState(state, action, "mapperReviewed");
    case RECEIVE_REVIEWED_BY_USER_TASKS:
      return updateReduxState(state, action, "reviewedByUser");
    case RECEIVE_REVIEW_NEEDED_TASKS:
      return updateReduxState(state, action, "reviewNeeded");
    case RECEIVE_REVIEW_METRICS:
      return updateReduxState(state, action, "metrics");
    case RECEIVE_REVIEW_TAG_METRICS:
      return updateReduxState(state, action, "tagMetrics");
    case RECEIVE_REVIEW_CLUSTERS:
      return updateReduxState(state, action, "clusters");
    case RECEIVE_REVIEW_CHALLENGES:
      return updateReduxState(state, action, "reviewChallenges");
    case RECEIVE_REVIEW_PROJECTS:
      return updateReduxState(state, action, "reviewProjects");
    default:
      return state;
  }
};

const updateReduxState = function (state = {}, action, listName) {
  const mergedState = _cloneDeep(state);

  if (action.type === RECEIVE_REVIEW_METRICS) {
    mergedState[listName] = action.metrics;
    return mergedState;
  }

  if (action.type === RECEIVE_REVIEW_TAG_METRICS) {
    mergedState[listName] = action.tagMetrics;
    return mergedState;
  }

  if (action.type === RECEIVE_REVIEW_CLUSTERS) {
    if (action.fetchId !== state.fetchId || action.status !== state.status) {
      const fetchTime = parseInt(uuidTime.v1(action.fetchId));
      const lastFetch = state.fetchId ? parseInt(uuidTime.v1(state.fetchId)) : 0;

      if (fetchTime >= lastFetch) {
        mergedState.fetchId = action.fetchId;
        mergedState[listName] = action.clusters;
      }
    }

    return mergedState;
  }

  if (action.type === RECEIVE_REVIEW_CHALLENGES) {
    mergedState[listName] = action.reviewChallenges;
    return mergedState;
  }

  if (action.type === RECEIVE_REVIEW_PROJECTS) {
    mergedState[listName] = action.reviewProjects;
    return mergedState;
  }

  if (action.status === RequestStatus.success) {
    const updatedTasks = {};

    updatedTasks.tasks = Array.isArray(action.tasks) ? action.tasks : [];
    updatedTasks.totalCount = action.totalCount;
    updatedTasks.dataStale = false;

    mergedState[listName] = updatedTasks;
    return mergedState;
  } else {
    return state;
  }
};
