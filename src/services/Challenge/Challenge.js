import { format, parseISO, startOfDay } from "date-fns";
import _clone from "lodash/clone";
import _cloneDeep from "lodash/cloneDeep";
import _compact from "lodash/compact";
import _flatten from "lodash/flatten";
import _fromPairs from "lodash/fromPairs";
import _groupBy from "lodash/groupBy";
import _isEmpty from "lodash/isEmpty";
import _isObject from "lodash/isObject";
import _isString from "lodash/isString";
import _join from "lodash/join";
import _keys from "lodash/keys";
import _map from "lodash/map";
import _pick from "lodash/pick";
import _values from "lodash/values";
import { normalize, schema } from "normalizr";
import { commentSchema, receiveComments } from "../Comment/Comment";
import AppErrors from "../Error/AppErrors";
import { addError, addServerError } from "../Error/Error";
import { toLatLngBounds } from "../MapBounds/MapBounds";
import { fetchProject, projectSchema, receiveProjects } from "../Project/Project";
import {
  PARAMS_MAP,
  RESULTS_PER_PAGE,
  SortOptions,
  generateSearchParametersString,
  parseQueryString,
} from "../Search/Search";
import Endpoint from "../Server/Endpoint";
import genericEntityReducer from "../Server/GenericEntityReducer";
import RequestStatus from "../Server/RequestStatus";
import { defaultRoutes as api, isSecurityError } from "../Server/Server";
import { zeroTaskActions } from "../Task/TaskAction/TaskAction";
import { ensureUserLoggedIn } from "../User/User";
import { RECEIVE_CHALLENGES, REMOVE_CHALLENGE, SET_ADMIN_CHALLENGES } from "./ChallengeActions";
import { ChallengeStatus } from "./ChallengeStatus/ChallengeStatus";

/**
 * Constants defining searches to include/exclude 'local' challenges.
 */
export const CHALLENGE_EXCLUDE_LOCAL = 0;
export const CHALLENGE_INCLUDE_LOCAL = 1;
export const CHALLENGE_ONLY_LOCAL = 2;

// normalizr schema
export const challengeSchema = function () {
  return new schema.Entity("challenges", { parent: projectSchema() });
};

const validatePriorityBounds = (bounds) => {
  if (!Array.isArray(bounds)) return [];

  return bounds.filter((feature) => {
    const coords = feature?.geometry?.coordinates?.[0];
    return feature?.geometry?.type === "Polygon" && Array.isArray(coords) && coords.length >= 4;
  });
};

/**
 * normalizr denormalization schema, which will also pull in comments (fetched
 * separately, so not used in normal schema)
 */
export const challengeDenormalizationSchema = function () {
  return new schema.Entity("challenges", {
    parent: projectSchema(),
    comments: [commentSchema()],
    virtualParents: [projectSchema()],
  });
};

// utility functions
/**
 * Builds a link to export CSV
 */
export const buildLinkToExportCSV = function (
  challengeId,
  criteria,
  timezone = null,
  page = -1,
  limit,
) {
  let pageString = "";

  if (page > -1) {
    pageString = `&page=${page}&limit=${limit}`;
  }

  const queryFilters = buildQueryFilters(criteria);
  return (
    `${window.env.REACT_APP_MAP_ROULETTE_SERVER_URL}/api/v2/challenge/` +
    `${challengeId}/tasks/extract?${queryFilters}&timezone=${encodeURIComponent(
      timezone,
    )}${pageString}`
  );
};

/**
 * Builds a link to export GeoJSON
 */
export const buildLinkToExportGeoJSON = function (challengeId, criteria, timezone = "", filename) {
  const queryFilters = buildQueryFilters(criteria);
  return (
    `${window.env.REACT_APP_MAP_ROULETTE_SERVER_URL}/api/v2/challenge/view/` +
    `${challengeId}?${queryFilters}&timezone=${encodeURIComponent(
      timezone,
    )}&filename=${encodeURIComponent(filename)}`
  );
};

// Helper function to build query filters for export links
const buildQueryFilters = function (criteria) {
  const filters = criteria?.filters ?? {};
  const taskId = filters.id;
  const reviewRequestedBy = filters.reviewRequestedBy;
  const reviewedBy = filters.reviewedBy;
  const completedBy = filters.completedBy;
  const invf = _map(criteria.invertFields, (v, k) => (v ? PARAMS_MAP[k] : undefined));

  return (
    `status=${_join(filters.status, ",")}&` +
    `priority=${_join(filters.priorities, ",")}&` +
    `reviewStatus=${_join(filters.reviewStatus, ",")}` +
    `${taskId ? `&tid=${taskId}` : ""}` +
    `${completedBy ? `&m=${completedBy}` : ""}` +
    `${reviewRequestedBy ? `&o=${reviewRequestedBy}` : ""}` +
    `${reviewedBy ? `&r=${reviewedBy}` : ""}` +
    `&invf=${invf.join(",")}`
  );
};

/**
 * Retrieves the resulting challenge entity object from the given
 * normalizedChallengeResults, or null if there is no result.
 *
 * > Note that if the results contain multiple challenges, only the
 * > first challenge entity is returned.
 */
export const challengeResultEntity = function (normalizedChallengeResults) {
  const challengeId = Array.isArray(normalizedChallengeResults.result)
    ? normalizedChallengeResults.result[0]
    : normalizedChallengeResults.result;

  return Number.isFinite(challengeId)
    ? normalizedChallengeResults.entities.challenges[challengeId]
    : null;
};

// redux actions -- see Server/ChallengeActions

// redux action creators

/**
 * Add or update challenge data in the redux store
 */
export const receiveChallenges = function (normalizedEntities, status = RequestStatus.success) {
  if (normalizedEntities.challenges) {
    for (const c of Object.values(normalizedEntities.challenges)) {
      if (c.dataOriginDate) {
        c.dataOriginDate = format(parseISO(c.dataOriginDate), "yyyy-MM-dd");
      }
    }
  }

  return {
    type: RECEIVE_CHALLENGES,
    status,
    entities: normalizedEntities,
    receivedAt: Date.now(),
  };
};

/**
 * Remove a challenge from the redux store
 */
export const removeChallenge = function (challengeId) {
  return {
    type: REMOVE_CHALLENGE,
    challengeId,
    receivedAt: Date.now(),
  };
};

// async action creators

/**
 * Retrieve all featured challenges, up to the given limit.
 *
 * @param {number} limit
 */
export const fetchFeaturedChallenges = function (limit = RESULTS_PER_PAGE) {
  return function (dispatch) {
    return new Endpoint(api.challenges.featured, {
      schema: [challengeSchema()],
      params: { limit },
    })
      .execute()
      .then((normalizedResults) => {
        dispatch(receiveChallenges(normalizedResults.entities));
        return normalizedResults;
      })
      .catch((error) => {
        dispatch(addError(AppErrors.challenge.fetchFailure));
        console.log(error.response || error);
      });
  };
};

/**
 * Retrieve a listing of challenges (that include featured, popular, and newest)
 * up to the given limit.
 *
 * @param {array} projectIds
 * @param {number} limit
 */
export const fetchPreferredChallenges = function (limit = RESULTS_PER_PAGE) {
  return function (dispatch) {
    return new Endpoint(api.challenges.preferred, {
      schema: {
        popular: [challengeSchema()],
        featured: [challengeSchema()],
        newest: [challengeSchema()],
      },
      params: { limit },
    })
      .execute()
      .then((normalizedResults) => {
        const result = normalizedResults.result;
        const challenges = normalizedResults.entities.challenges;

        for (const challenge of result.popular) {
          challenges[challenge].popular = true;
        }

        for (const challenge of result.newest) {
          challenges[challenge].newest = true;
        }

        for (const challenge of result.featured) {
          challenges[challenge].featured = true;
        }

        dispatch(receiveChallenges(normalizedResults.entities));

        return normalizedResults;
      })
      .catch((error) => {
        dispatch(addError(AppErrors.challenge.fetchFailure));
        console.log(error.response || error);
      });
  };
};

/**
 * Retrieve a listing of tweetable challenges
 *
 * @param {number} limit
 */
export const fetchSocialChallenges = function (limit = RESULTS_PER_PAGE) {
  return new Endpoint(api.challenges.preferred, {
    params: { limit },
  }).execute();
};

/**
 * Retrieve a listing of challenges in the given projects, up to the given limit.
 *
 * @param {array} projectIds
 * @param {number} limit
 */
export const fetchProjectChallengeListing = function (projectIds, onlyEnabled = false, limit = -1) {
  return function (dispatch) {
    return new Endpoint(api.challenges.listing, {
      schema: [challengeSchema()],
      params: {
        projectIds: Array.isArray(projectIds) ? projectIds.join(",") : projectIds,
        onlyEnabled,
        limit,
      },
    })
      .execute()
      .then((normalizedResults) => {
        dispatch(receiveChallenges(normalizedResults.entities));
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

/**
 * Execute a challenge search, using extendedFind, from the given challenges
 * search object
 */
export const performChallengeSearch = function (searchObject, limit = RESULTS_PER_PAGE) {
  const sortCriteria = searchObject?.sort ?? {};
  const archived = searchObject?.archived ?? false;
  const filters = searchObject?.filters ?? {};
  const queryString = searchObject?.query;
  const page = searchObject?.page?.currentPage;
  const onlyEnabled = searchObject?.onlyEnabled ?? true;
  const admin = searchObject?.admin ?? false;
  let bounds = null;

  if (filters && filters.location !== undefined) {
    bounds = searchObject?.mapBounds?.bounds;
  }

  const challengeStatus = [
    ChallengeStatus.ready,
    ChallengeStatus.partiallyLoaded,
    ChallengeStatus.none,
    ChallengeStatus.empty,
  ];

  return extendedFind(
    {
      searchQuery: queryString,
      filters,
      sortCriteria,
      bounds,
      page,
      challengeStatus,
      archived,
      onlyEnabled,
    },
    limit,
    admin,
  );
};

/**
 * Fetches challenges that contain any of the given criteria
 * (including: keywords/tags, column to sort results by, filters),
 * up to the given limit.
 *
 * @param {object} criteria - criteria to include in search. Can include keys:
 *                            'searchQuery', 'filters', 'onlyEnabled', 'bounds'
 *                            'sortCriteria.sortBy', 'sortCrtiera.direction',
                              'page', 'challengeStatus'
 * @param {number} limit
 */
export const extendedFind = function (criteria, limit = RESULTS_PER_PAGE, admin = false) {
  const queryString = criteria.searchQuery;
  const filters = criteria.filters || {};
  const onlyEnabled = criteria.onlyEnabled === undefined ? true : criteria.onlyEnabled;

  const bounds = criteria.bounds;
  const sortBy = criteria?.sortCriteria?.sortBy ?? SortOptions.popular;
  const direction = (criteria?.sortCriteria?.direction || "DESC").toUpperCase();
  const sort = sortBy ? `${sortBy}` : null;
  const page = Number.isFinite(criteria.page) ? criteria.page : 0;
  const challengeStatus = criteria.challengeStatus;

  return function (dispatch) {
    const queryParts = parseQueryString(queryString);

    // setup query parameters desired by server.
    // ce: limit to enabled challenges
    // pe: limit to enabled projects
    // ps: limit to projects matching name search
    // cs: query string
    // cd: challenge difficulty
    // ct: keywords/tags (comma-separated string)
    // cid: challenge id
    const queryParams = {
      limit,
      ce: onlyEnabled ? "true" : "false",
      pe: onlyEnabled ? "true" : "false",
      // exclude local challenges if we are only finding enabled
      cLocal: onlyEnabled ? CHALLENGE_EXCLUDE_LOCAL : CHALLENGE_INCLUDE_LOCAL,
    };

    if (Number.isFinite(filters.difficulty)) {
      queryParams.cd = filters.difficulty;
    }

    if (_isString(filters.project)) {
      queryParams.ps = filters.project;
    }

    if (_isString(filters.challengeId)) {
      queryParams.cid = filters.challengeId;
    }

    if (filters.archived) {
      queryParams.ca = filters.archived;
    }

    queryParams.cg = Boolean(filters.global);

    // Keywords/tags can come from both the the query and the filter, so we need to
    // combine them into a single keywords array.
    const keywords = queryParts.tagTokens.concat(
      Array.isArray(filters.keywords) ? filters.keywords : [],
    );

    if (keywords.length > 0) {
      queryParams.ct = keywords.join(",");
    }

    if (queryParts.query.length > 0) {
      queryParams.cs = queryParts.query;
    }

    queryParams.sort = sort;
    queryParams.order = direction;
    queryParams.page = page * limit;

    if (challengeStatus) {
      queryParams.cStatus = challengeStatus.join(",");
    }

    if (bounds) {
      const boundsObject = toLatLngBounds(bounds);
      queryParams.bb = boundsObject.toBBoxString();
    }

    return new Endpoint(api.challenges.search, {
      schema: [challengeSchema()],
      params: queryParams,
    })
      .execute()
      .then((normalizedResults) => {
        if (!admin) {
          dispatch(receiveChallenges(normalizedResults.entities));
        }
        return normalizedResults;
      })
      .catch((error) => {
        dispatch(addError(AppErrors.challenge.searchFailure));
        console.log(error.response || error);
      });
  };
};

/**
 * Fetch action metrics for the given challenge (or all challenges
 * if none is given).
 */
export const fetchChallengeActions = function (
  challengeId = null,
  suppressReceive = false,
  criteria,
  includeByPriority = true,
) {
  let searchParameters = {};
  if (criteria) {
    searchParameters = generateSearchParametersString(
      criteria?.filters ?? {},
      criteria.boundingBox,
      false,
      false,
      null,
      criteria?.invertFields ?? {},
    );
  }

  return function (dispatch) {
    const challengeActionsEndpoint = new Endpoint(
      Number.isFinite(challengeId) ? api.challenge.actions : api.challenges.actions,
      {
        schema: [challengeSchema()],
        variables: { id: challengeId },
        params: { ...searchParameters, includeByPriority },
      },
    );

    return challengeActionsEndpoint
      .execute()
      .then((normalizedResults) => {
        // If we requested actions on a specific challenge and got nothing back,
        // replace the results with a zeroed-out actions object so our app can
        // know the challenge has no actions.
        if (Number.isFinite(challengeId) && _isEmpty(normalizedResults.result)) {
          normalizedResults.result = [challengeId];
          normalizedResults.entities = {
            challenges: {
              [challengeId]: {
                id: challengeId,
                actions: zeroTaskActions(),
              },
            },
          };
        }

        if (!suppressReceive) {
          dispatch(receiveChallenges(normalizedResults.entities));
        }
        return normalizedResults;
      })
      .catch((error) => {
        if (isSecurityError(error)) {
          //We are making 401s for this endpoint silent to allow overview
          //pages to continue to function without challenge action data.
          //This is a temporary solution until performance degredation in
          //maproulette-backend's DataController is addressed.
          //Also see https://github.com/maproulette/maproulette-backend/pull/1014
          return [];
        } else {
          dispatch(addError(AppErrors.challenge.fetchFailure));
          console.log(error.response || error);
        }
      });
  };
};

/**
 * Fetch action metrics for all challenges in the given project.
 */
export const fetchProjectChallengeActions = function (
  projectId,
  onlyEnabled = false,
  includeByPriority = true,
) {
  return function (dispatch) {
    return new Endpoint(api.challenges.actions, {
      schema: [challengeSchema()],
      params: { projectList: projectId, onlyEnabled, includeByPriority },
    })
      .execute()
      .then((normalizedResults) => {
        dispatch(receiveChallenges(normalizedResults.entities));
      })
      .catch((error) => {
        if (isSecurityError(error)) {
          //We are making 401s for this endpoint silent to allow overview
          //pages to continue to function without challenge action data.
          //This is a temporary solution until performance degredation in
          //maproulette-backend's DataController is addressed.
          //Also see https://github.com/maproulette/maproulette-backend/pull/1014
          return [];
        } else {
          dispatch(addError(AppErrors.challenge.fetchFailure));
          console.log(error.response || error);
        }
      });
  };
};

/**
 * Fetch tag metrics for the given challenge
 */
export const fetchTagMetrics = function (userId, criteria) {
  let searchParameters = {};

  if (criteria) {
    searchParameters = generateSearchParametersString(
      criteria?.filters ?? {},
      criteria.boundingBox,
      false,
      false,
      null,
      criteria?.invertFields ?? {},
    );
  }

  return function (dispatch) {
    return new Endpoint(api.challenges.tagMetrics, {
      params: { ...searchParameters },
    })
      .execute()
      .then((normalizedResults) => {
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

/**
 * Fetch activity timeline for the given challenge
 */
export const fetchChallengeActivity = function (challengeId, startDate, endDate) {
  return function (dispatch) {
    const params = {};
    if (startDate) {
      params.start = startOfDay(startDate).toISOString();
    }

    if (endDate) {
      params.end = startOfDay(endDate).toISOString();
    }

    return new Endpoint(api.challenge.activity, {
      variables: { id: challengeId },
      params,
    })
      .execute()
      .then((rawActivity) => {
        const normalizedResults = {
          entities: {
            challenges: {
              [challengeId]: { id: challengeId, activity: rawActivity },
            },
          },
        };

        return dispatch(receiveChallenges(normalizedResults.entities));
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

/**
 * Fetch comments for the given challenge
 */
export const fetchChallengeComments = function (challengeId) {
  return function (dispatch) {
    return new Endpoint(api.challenge.comments, {
      variables: { id: challengeId },
    })
      .execute()
      .then((rawComments) => {
        // Comments are indexed by task id, so we need to extract them
        // into a single array and manually denormalize
        const commentArray = _flatten(_values(rawComments));
        const normalizedComments = normalize(commentArray, [commentSchema()]);
        dispatch(receiveComments(normalizedComments.entities));

        if (_isObject(normalizedComments.entities.comments)) {
          // Inject comment ids into challenge.
          dispatch(
            receiveChallenges({
              challenges: {
                [challengeId]: {
                  id: challengeId,
                  comments: _map(_keys(normalizedComments.entities.comments), (id) =>
                    parseInt(id, 10),
                  ),
                },
              },
            }),
          );
        }

        return normalizedComments;
      });
  };
};

/**
 * Fetch challenge comments for the given project
 */
export const fetchProjectChallengeComments = function (projectId) {
  return function (dispatch) {
    return new Endpoint(api.project.comments, { variables: { id: projectId } })
      .execute()
      .then((rawComments) => {
        const normalizedComments = normalize(rawComments, [commentSchema()]);
        dispatch(receiveComments(normalizedComments.entities));

        // Group comments by challenge and update challenges.
        const commentsByChallenge = _groupBy(rawComments, "challengeId");
        const normalizedChallenges = {
          challenges: _fromPairs(
            _map(commentsByChallenge, (comments, challengeId) => [
              parseInt(challengeId, 10),
              {
                id: parseInt(challengeId, 10),
                comments: _map(comments, "id"),
              },
            ]),
          ),
        };
        dispatch(receiveChallenges(normalizedChallenges));
        return normalizedComments;
      });
  };
};

/**
 * Fetch child challenges belonging to the given project, up to the given
 * limit.
 */
export const fetchProjectChallenges = function (projectId, limit = 50) {
  return function (dispatch) {
    return new Endpoint(api.project.challenges, {
      schema: [challengeSchema()],
      variables: { id: projectId },
      params: { limit },
    })
      .execute()
      .then((normalizedResults) => {
        dispatch(receiveChallenges(normalizedResults.entities));
        return normalizedResults;
      })
      .catch((error) => {
        dispatch(addError(AppErrors.challenge.fetchFailure));
        console.log(error.response || error);
      });
  };
};

/**
 * Fetch all task property keys on the challenge
 */
export const fetchPropertyKeys = function (challengeId) {
  return new Endpoint(api.challenge.propertyKeys, {
    schema: {},
    variables: { id: challengeId },
  })
    .execute()
    .then((normalizedResults) => {
      return normalizedResults?.result?.keys ?? [];
    })
    .catch((error) => {
      console.log(error.response || error);
    });
};

/**
 * Fetch data for the given challenge. Normally that data will be added to the
 * redux store, but that can be suppressed with the supressReceive flag.
 */
export const fetchChallenge = function (challengeId, suppressReceive = false) {
  return function (dispatch) {
    return new Endpoint(api.challenge.single, {
      schema: challengeSchema(),
      variables: { id: challengeId },
    })
      .execute()
      .then((normalizedResults) => {
        const challenge = normalizedResults.entities.challenges[normalizedResults.result];

        // If there are no virtual parents then this field will not be set by server
        // so we need to indicate it's empty.
        if (challenge.virtualParents === undefined) {
          challenge.virtualParents = [];
        }

        if (!suppressReceive) {
          dispatch(receiveChallenges(normalizedResults.entities));
        }

        return normalizedResults;
      })
      .catch((error) => {
        dispatch(addError(AppErrors.challenge.fetchFailure));
        console.log(error.response || error);
      });
  };
};

/**
 * Fetch data for multiple challenges identified by the given ids. Normally
 * that data will be added to the redux store, but that can be suppressed with
 * the supressReceive flag
 *
 * > Note that the challenge data is retrieved via the search API and may
 * therefore differ slightly from data fetched directly from the challenge API
 */
export const fetchChallenges = function (challengeIds, suppressReceive = false) {
  return function (dispatch) {
    if (!Array.isArray(challengeIds) || challengeIds.length === 0) {
      return Promise.success();
    }

    return new Endpoint(api.challenges.search, {
      schema: [challengeSchema()],
      params: { [PARAMS_MAP.challengeId]: challengeIds.join(",") },
    })
      .execute()
      .then((normalizedResults) => {
        // Check if we have challenges in the response
        if (!normalizedResults.entities || !normalizedResults.entities.challenges) {
          return normalizedResults;
        }

        // Get challenges as an array of values since it's an object with IDs as keys
        const challengeValues = Object.values(normalizedResults.entities.challenges);

        // Process each challenge
        for (const challenge of challengeValues) {
          if (challenge.virtualParents === undefined) {
            challenge.virtualParents = [];
          }
        }

        if (!suppressReceive) {
          dispatch(receiveChallenges(normalizedResults.entities));
          // Only dispatch receiveProjects if there are projects in the response
          if (normalizedResults.entities.projects) {
            dispatch(receiveProjects(normalizedResults.entities));
          }
        }

        return normalizedResults;
      })
      .catch((error) => {
        dispatch(addError(AppErrors.challenge.fetchFailure));
        console.log(error.response || error);
      });
  };
};

/**
 * Saves the given challenge (either creating it or updating it, depending on
 * whether it already has an id) and updates the redux store with the latest
 * version from the server.
 *
 * If storeResponse is false, the redux store will not be updated with the
 * response data upon completion of a successful request.
 */
export const saveChallenge = function (originalChallengeData, storeResponse = true) {
  return function (dispatch) {
    // The server wants keywords/tags represented as a comma-separated string.
    let challengeData = _clone(originalChallengeData);

    if (Array.isArray(challengeData.tags)) {
      challengeData.tags = challengeData.tags.map((t) => t.trim()).join(",");
    } else if (challengeData.tags) {
      challengeData.tags = challengeData.tags.trim();
    }

    if (Array.isArray(challengeData.preferredTags)) {
      challengeData.preferredTags = challengeData.preferredTags.map((t) => t.trim()).join(",");
    } else if (challengeData.preferredTags) {
      challengeData.preferredTags = challengeData.preferredTags.trim();
    }

    if (Array.isArray(challengeData.preferredReviewTags)) {
      challengeData.preferredReviewTags = challengeData.preferredReviewTags
        .map((t) => t.trim())
        .join(",");
    } else if (challengeData.preferredReviewTags) {
      challengeData.preferredReviewTags = challengeData.preferredReviewTags.trim();
    }

    // If there is local GeoJSON content being transmitted as a string, parse
    // it into JSON first.
    if (_isString(challengeData.localGeoJSON) && !_isEmpty(challengeData.localGeoJSON)) {
      challengeData.localGeoJSON = JSON.parse(challengeData.localGeoJSON);
    }

    // If there is local JSON content being transmitted as a string, parse
    // it into JSON first.
    if (
      _isString(challengeData.taskWidgetLayout) &&
      !challengeData.taskWidgetLayout?.workspace &&
      challengeData.taskWidgetLayout
    ) {
      try {
        if (!(JSON.parse(challengeData.taskWidgetLayout).workspace.name === "taskCompletion")) {
          throw new Error(
            "Widget layout for task completion flow with the wrong format was submitted, it was not included in the save.",
          );
        }
        challengeData.taskWidgetLayout = JSON.parse(challengeData.taskWidgetLayout);
      } catch (error) {
        challengeData.taskWidgetLayout = "";
        console.error(error);
      }
    }

    if (challengeData.highPriorityBounds) {
      const validatedBounds = validatePriorityBounds(challengeData.highPriorityBounds);
      challengeData.highPriorityBounds = JSON.stringify(validatedBounds);
    }

    if (challengeData.mediumPriorityBounds) {
      const validatedBounds = validatePriorityBounds(challengeData.mediumPriorityBounds);
      challengeData.mediumPriorityBounds = JSON.stringify(validatedBounds);
    }

    if (challengeData.lowPriorityBounds) {
      const validatedBounds = validatePriorityBounds(challengeData.lowPriorityBounds);
      challengeData.lowPriorityBounds = JSON.stringify(validatedBounds);
    }

    // We need to remove any old challenge keywords first, prior to the
    // update.
    return removeChallengeKeywords(challengeData.id, challengeData.removedTags).then(() => {
      challengeData = _pick(
        challengeData, // fields in  alphabetical order
        [
          "blurb",
          "challengeType",
          "checkinComment",
          "checkinSource",
          "customBasemap",
          "defaultBasemap",
          "defaultBasemapId",
          "defaultPriority",
          "defaultZoom",
          "description",
          "difficulty",
          "enabled",
          "featured",
          "highPriorityBounds",
          "highPriorityRule",
          "id",
          "instruction",
          "localGeoJSON",
          "lowPriorityBounds",
          "lowPriorityRule",
          "maxZoom",
          "mediumPriorityBounds",
          "mediumPriorityRule",
          "minZoom",
          "name",
          "overpassQL",
          "overpassTargetType",
          "parent",
          "paused",
          "datasetUrl",
          "remoteGeoJson",
          "status",
          "tags",
          "updateTasks",
          "virtualParents",
          "exportableProperties",
          "osmIdProperty",
          "taskBundleIdProperty",
          "dataOriginDate",
          "preferredTags",
          "preferredReviewTags",
          "presets",
          "limitTags",
          "limitReviewTags",
          "taskStyles",
          "requireConfirmation",
          "requireRejectReason",
          "requiresLocal",
          "reviewSetting",
          "taskWidgetLayout",
          "automatedEditsCodeAgreement",
        ],
      );

      if (challengeData.dataOriginDate) {
        // Set the timestamp on the dataOriginDate so we get proper timezone info.
        challengeData.dataOriginDate = parseISO(challengeData.dataOriginDate).toISOString();
      }

      // Validate the fields before saving
      const { description, name, checkinComment } = challengeData;

      if (
        challengeData.parent != undefined &&
        (!description?.trim()?.length ||
          !name ||
          name.length <= 3 ||
          !checkinComment ||
          checkinComment === "#maproulette")
      ) {
        let errorMessage = "";

        if (name === undefined || name.length <= 3) {
          errorMessage = AppErrors.challengeSaveFailure.saveNameFailure;
        } else if (description === undefined || description === "") {
          errorMessage = AppErrors.challengeSaveFailure.saveDescriptionFailure;
        } else if (
          checkinComment === undefined ||
          checkinComment === "" ||
          checkinComment === "#maproulette"
        ) {
          errorMessage = AppErrors.challengeSaveFailure.saveChangesetDescriptionFailure;
        } else {
          errorMessage = AppErrors.challengeSaveFailure.saveDetailsFailure;
        }

        dispatch(addServerError(errorMessage));
        throw new Error(errorMessage);
      }

      // Agreement box should be checked, but if it passes as true the property should not be included
      // in the data sent to server.
      if (
        !Number.isFinite(challengeData.id) &&
        Object.hasOwn(challengeData, "automatedEditsCodeAgreement")
      ) {
        if (!challengeData.automatedEditsCodeAgreement) {
          const errorMessage = AppErrors.challengeSaveFailure.saveEditPolicyAgreementFailure;
          dispatch(addServerError(errorMessage));
          throw new Error(errorMessage);
        } else {
          delete challengeData.automatedEditsCodeAgreement;
        }
      }

      // Setup the save function to either edit or create the challenge
      // depending on whether it has an id.
      const saveEndpoint = new Endpoint(
        Number.isFinite(challengeData.id) ? api.challenge.edit : api.challenge.create,
        {
          schema: challengeSchema(),
          variables: { id: challengeData.id },
          json: challengeData,
        },
      );

      return saveEndpoint
        .execute()
        .then((normalizedResults) => {
          if (storeResponse) {
            dispatch(receiveChallenges(normalizedResults.entities));
          }

          return normalizedResults?.entities?.challenges?.[normalizedResults.result];
        })
        .catch((serverError) => {
          if (isSecurityError(serverError)) {
            dispatch(ensureUserLoggedIn()).then(() =>
              dispatch(addError(AppErrors.user.unauthorized)),
            );
          } else {
            console.log(serverError.response || serverError);
            dispatch(
              addServerError(AppErrors.challengeSaveFailure.saveDetailsFailure, serverError),
            );

            // Reload challenge data to ensure our local store is in sync with the
            // server in case optimistic changes were made.
            dispatch(fetchChallenge(challengeData.id));
          }
        });
    });
  };
};

/**
 * Send challenge GeoJSON to the server. This is primarily intended for
 * line-by-line GeoJSON, which must be submitted separately from the challenge,
 * but standard geoJSON files can also be accommodated (set lineByLine to false
 * in that case).
 *
 * If removeUnmatchedTasks is set to true, then incomplete tasks will be removed
 * prior to processing of updated sourced data
 */
export const uploadChallengeGeoJSON = function (
  challengeId,
  geoJSON,
  lineByLine = true,
  removeUnmatchedTasks = false,
  dataOriginDate,
) {
  return function () {
    // Server expects the file in a form part named "json"
    const formData = new FormData();
    formData.append(
      "json",
      new File([geoJSON], `challenge_${challengeId}_tasks_${Date.now()}.geojson`),
    );

    if (dataOriginDate) {
      // Set the timestamp on the dataOriginDate so we get proper timezone info.
      dataOriginDate = parseISO(dataOriginDate).toISOString();
    }

    return new Endpoint(api.challenge.uploadGeoJSON, {
      variables: { id: challengeId },
      params: {
        lineByLine,
        removeUnmatched: removeUnmatchedTasks,
        dataOriginDate,
        skipSnapshot: true,
      },
      formData,
    }).execute();
  };
};

/**
 * Set whether the given challenge is enabled (publicly visible) or not.
 */
export const setIsEnabled = function (challengeId, isEnabled) {
  return function (dispatch) {
    // Optimistically assume request will succeed. The store will be updated
    // with fresh challenge data from the server if the save encounters
    // an error.
    dispatch(
      receiveChallenges({
        challenges: {
          [challengeId]: {
            id: challengeId,
            enabled: isEnabled,
          },
        },
      }),
    );

    saveChallenge({ id: challengeId, enabled: isEnabled }, false)(dispatch);
  };
};

/**
 * Set whether the given challenge is paused (blocking task completion and
 * review while leaving existing task statuses untouched) or not.
 */
export const setPaused = function (challengeId, isPaused) {
  return function (dispatch) {
    // Optimistically assume request will succeed. The store will be updated
    // with fresh challenge data from the server if the save encounters
    // an error.
    dispatch(
      receiveChallenges({
        challenges: {
          [challengeId]: {
            id: challengeId,
            paused: isPaused,
          },
        },
      }),
    );

    saveChallenge({ id: challengeId, paused: isPaused }, false)(dispatch);
  };
};

/**
 * Rebuild tasks in the given challenge
 *
 * If removeUnmatchedTasks is set to true, then incomplete tasks that don't
 * match a task in the updated source data will be removed
 */
export const rebuildChallenge = function (challengeId, removeUnmatchedTasks = false) {
  return function (dispatch) {
    return new Endpoint(api.challenge.rebuild, {
      variables: { id: challengeId },
      params: { removeUnmatched: removeUnmatchedTasks, skipSnapshot: true },
    })
      .execute()
      .then(
        () => fetchChallenge(challengeId)(dispatch), // Refresh challenge data
      )
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          dispatch(addError(AppErrors.challenge.rebuildFailure));
          console.log(error.response || error);
        }
      });
  };
};

/**
 * Move the given challenge to the given project.
 */
export const moveChallenge = function (challengeId, toProjectId) {
  return function (dispatch) {
    return new Endpoint(api.challenge.move, {
      variables: { challengeId, projectId: toProjectId },
    })
      .execute()
      .then(
        () => fetchChallenge(challengeId)(dispatch), // Refresh challenge data
      )
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          dispatch(addError(AppErrors.challenge.moveFailure));
          console.log(error.response || error);
        }
      });
  };
};

/**
 * Move a list of challenges to the given project.
 */
export const moveChallenges = function (challengeIds, toProjectId) {
  return function (dispatch) {
    return new Endpoint(api.challenges.move, {
      variables: { projectId: toProjectId },
      json: { challenges: challengeIds },
    })
      .execute()
      .then(() => {
        for (const id of challengeIds) {
          fetchChallenge(id)(dispatch);
        }
      })
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          dispatch(addError(AppErrors.challenge.moveFailure));
          console.log(error.response || error);
        }
      });
  };
};

/**
 * Deletes the given challenge from the server.
 */
export const deleteChallenge = function (challengeId) {
  return function (dispatch) {
    return new Endpoint(api.challenge.delete, {
      variables: { id: challengeId },
    })
      .execute()
      .then(() => dispatch(removeChallenge(challengeId)))
      .catch((error) => {
        // Update with the latest challenge data.
        fetchChallenge(challengeId)(dispatch);

        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          dispatch(addError(AppErrors.challenge.deleteFailure));
          console.log(error.response || error);
        }
      });
  };
};

/**
 * updates the archive status of the given challenge.
 */
export const archiveChallenge = function (challengeId, bool) {
  return function (dispatch) {
    // calling archive is necessary to nullify the system_archived_at field
    new Endpoint(api.challenge.archive, {
      variables: { id: challengeId },
      json: { isArchived: bool },
    }).execute();

    // calling 'edit' in addition to 'archive' is necessary to override the cache mechanism in the BE.
    return new Endpoint(api.challenge.edit, {
      variables: { id: challengeId },
      json: { isArchived: bool },
    })
      .execute()
      .then(() => {
        fetchChallenge(challengeId)(dispatch);
      })
      .catch((error) => {
        // Update with the latest challenge data.
        fetchChallenge(challengeId)(dispatch);

        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          dispatch(addError(AppErrors.challenge.archiveChallenge));
          console.log(error.response || error);
        }
      });
  };
};

export const archiveChallenges = function (projectId, challengeIds, bool) {
  return function (dispatch) {
    return new Endpoint(api.challenges.bulkArchive, {
      json: { isArchived: bool, ids: challengeIds },
    })
      .execute()
      .then(() => {
        return true;
      })
      .catch((error) => {
        if (isSecurityError(error)) {
          dispatch(ensureUserLoggedIn()).then(() =>
            dispatch(addError(AppErrors.user.unauthorized)),
          );
        } else {
          dispatch(addError(AppErrors.challenge.archiveFailure));
          console.log(error.response || error);
        }
      });
  };
};

/**
 * Retrieves the parent project embedded in the given normalized challenge
 * results.
 *
 * > Note that if the results contain multiple challenges, only the
 * > parent project of the first result is retrieved.
 */
export const fetchParentProject = function (dispatch, normalizedChallengeResults) {
  const challenge = challengeResultEntity(normalizedChallengeResults);

  if (challenge) {
    return dispatch(fetchProject(challenge.parent));
  }
};

/**
 * Search for keyword by prefix. Resolves with a (possibly empty) list of
 * results.
 */
export const findKeyword = function (keywordPrefix, tagType = null) {
  const tagTypes = Array.isArray(tagType) ? tagType.join(",") : tagType;
  return new Endpoint(api.keywords.find, {
    params: { prefix: keywordPrefix, tagTypes },
  }).execute();
};

/**
 * Removes the given oldKeywords from the given challenge. If no
 * keywords are provided, nothing is done.
 *
 * @private
 *
 * @returns a Promise
 */
const removeChallengeKeywords = function (challengeId, oldKeywords = []) {
  // If no challenge id, nothing to do
  if (!Number.isFinite(challengeId)) {
    return Promise.resolve();
  }

  // strip empty tags
  const toRemove = _compact(_map(oldKeywords, (tag) => (_isEmpty(tag) ? null : tag)));

  // if no keywords given, nothing to do.
  if (toRemove.length === 0) {
    return Promise.resolve();
  } else {
    return new Endpoint(api.challenge.removeKeywords, {
      variables: { id: challengeId },
      params: { tags: toRemove.join(",") },
    }).execute();
  }
};

/**
 * reduceChallengesFurther will be invoked by the genericEntityReducer function to
 * perform additional reduction on challenge entities.
 *
 * @private
 */
const reduceChallengesFurther = function (mergedState, oldState, challengeEntities) {
  // The generic reduction will merge arrays and objects, but for some fields
  // we want to simply overwrite with the latest data.
  for (const entity of challengeEntities) {
    // Until we implement undelete, ignore deleted challenges.
    if (entity.deleted) {
      delete mergedState[entity.id];
      return;
    }

    if (Array.isArray(entity.tags)) {
      mergedState[entity.id].tags = entity.tags;
    }

    if (_isObject(entity.highPriorityRule)) {
      mergedState[entity.id].highPriorityRule = entity.highPriorityRule;
    }

    if (_isObject(entity.mediumPriorityRule)) {
      mergedState[entity.id].mediumPriorityRule = entity.mediumPriorityRule;
    }

    if (_isObject(entity.lowPriorityRule)) {
      mergedState[entity.id].lowPriorityRule = entity.lowPriorityRule;
    }

    if (Array.isArray(entity.highPriorityBounds)) {
      mergedState[entity.id].highPriorityBounds = entity.highPriorityBounds;
    }

    if (Array.isArray(entity.mediumPriorityBounds)) {
      mergedState[entity.id].mediumPriorityBounds = entity.mediumPriorityBounds;
    }

    if (Array.isArray(entity.lowPriorityBounds)) {
      mergedState[entity.id].lowPriorityBounds = entity.lowPriorityBounds;
    }

    if (Array.isArray(entity.activity)) {
      mergedState[entity.id].activity = entity.activity;
    }

    if (Array.isArray(entity.virtualParents)) {
      mergedState[entity.id].virtualParents = entity.virtualParents;
    }

    if (Array.isArray(entity.taskStyles)) {
      mergedState[entity.id].taskStyles = entity.taskStyles;
    }

    if (Array.isArray(entity.presets)) {
      mergedState[entity.id].presets = entity.presets;
    }
  }
};

// redux reducers
export const challengeEntities = function (state, action) {
  if (action.type === REMOVE_CHALLENGE) {
    const mergedState = _cloneDeep(state);
    mergedState[action.challengeId].deleted = true;
    return mergedState;
  } else {
    return genericEntityReducer(
      RECEIVE_CHALLENGES,
      "challenges",
      reduceChallengesFurther,
    )(state, action);
  }
};

const ADMIN_CHALLENGES_INITIAL_STATE = {
  data: [],
  loadingCompleted: false,
};

export const adminChallengeEntities = function (state = ADMIN_CHALLENGES_INITIAL_STATE, action) {
  switch (action.type) {
    case SET_ADMIN_CHALLENGES:
      return {
        data: action.payload,
        loadingCompleted: action.loadingCompleted,
      };
    default:
      return state;
  }
};
