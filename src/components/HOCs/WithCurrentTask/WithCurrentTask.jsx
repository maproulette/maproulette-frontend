import _isPlainObject from "lodash/isPlainObject";
import _isString from "lodash/isString";
import _omit from "lodash/omit";
import { denormalize } from "normalizr";
import { Component } from "react";
import { connect } from "react-redux";
import AsCooperativeWork from "../../../interactions/Task/AsCooperativeWork";
import AsMappableBundle from "../../../interactions/TaskBundle/AsMappableBundle";
import { fetchChallenge, fetchParentProject } from "../../../services/Challenge/Challenge";
import { fetchChallengeActions } from "../../../services/Challenge/Challenge";
import { CHALLENGE_STATUS_FINISHED } from "../../../services/Challenge/ChallengeStatus/ChallengeStatus";
import AppErrors from "../../../services/Error/AppErrors";
import { addError } from "../../../services/Error/Error";
import {
  fetchOSMData,
  fetchOSMElement,
  fetchOSMElementHistory,
  fetchOSMUser,
} from "../../../services/OSM/OSM";
import { fetchProject } from "../../../services/Project/Project";
import {
  addTaskBundleComment,
  addTaskComment,
  completeTask,
  completeTaskBundle,
  editTaskComment,
  fetchTask,
  fetchTaskBundle,
  fetchTaskComments,
  fetchTaskPlace,
  loadRandomTaskFromChallenge,
  loadRandomTaskFromVirtualChallenge,
  startTask,
  taskDenormalizationSchema,
  updateCompletionResponses,
  updateTaskTags,
} from "../../../services/Task/Task";
import { TaskLoadMethod } from "../../../services/Task/TaskLoadMethod/TaskLoadMethod";
import { isLockableTask } from "../../../services/Task/TaskLock";
import { fetchTaskForReview } from "../../../services/Task/TaskReview/TaskReview";
import { fetchUser } from "../../../services/User/User";
import { renewVirtualChallenge } from "../../../services/VirtualChallenge/VirtualChallenge";

const CHALLENGE_STALE = 300000; // 5 minutes
const PROJECT_STALE = 300000; // 5 minutes

/**
 * WithCurrentTask passes down the denormalized task specified in either the
 * current route or, if that's not available, the `taskId` prop. The
 * immediately available value in the redux store will be given first, but
 * a current copy of the task will also be fetched and passed down when
 * available.  A `completeTask` function is also made available to the wrapped
 * component, which can be used to mark the current task as complete with a
 * given status.
 *
 * @author [Neil Rotstan](https://github.com/nrotstan)
 */
const WithCurrentTask = (WrappedComponent, forReview = false) =>
  connect(mapStateToProps, mapDispatchToProps)(WithLoadedTask(WrappedComponent, forReview));

/**
 * WithLoadedTask is a private HOC used to fetch an up-to-date copy of the task
 * and parent challenge from the server.
 *
 * @private
 */
const WithLoadedTask = function (WrappedComponent, forReview) {
  return class extends Component {
    loadNeededTask = (props) => {
      if (Number.isFinite(props.taskId)) {
        props.loadTask(props.taskId, props?.projectId, props.task, forReview);
      }
    };

    componentDidMount() {
      this.loadNeededTask(this.props);
    }

    componentDidUpdate(prevProps) {
      if (this.props.taskId !== prevProps.taskId) {
        // Only fetch if task data is missing or stale
        this.loadNeededTask(this.props);
      }
    }

    render() {
      // We don't need to pass anything down. WithCurrentTask grabs the latest
      // from the redux store, which is where our updated copy will end up.
      return <WrappedComponent {..._omit(this.props, "loadTask")} />;
    }
  };
};

export const mapStateToProps = (state, ownProps) => {
  const mappedProps = { task: null };

  const taskId = taskIdFromRoute(ownProps, ownProps.taskId);
  if (Number.isFinite(taskId)) {
    mappedProps.taskId = taskId;
    const taskEntity = state.entities?.tasks?.[taskId];

    if (taskEntity) {
      // Store
      const challengeId = taskEntity.parent;
      const projectId = state.entities?.challenges?.[challengeId]?.parent;
      // denormalize task so that parent challenge is embedded.
      mappedProps.task = denormalize(taskEntity, taskDenormalizationSchema(), state.entities);

      // The above projection oblisterates parent identifiers, project them back in as needed
      if (Number.isFinite(projectId)) {
        mappedProps.projectId = projectId;
      }

      mappedProps.challengeId = mappedProps.task?.parent?.id;
    }
  }

  return mappedProps;
};

export const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    /**
     * For the LoadCurrentTask private HOC.
     *
     * @private
     */
    loadTask: (taskId, projectId, existingTask = null, forReview = false) => {
      dispatch(forReview ? fetchTaskForReview(taskId) : fetchTask(taskId))
        .then((normalizedResults) => {
          if (
            !Number.isFinite(normalizedResults.result) ||
            normalizedResults?.entities?.tasks?.[normalizedResults.result]?.deleted
          ) {
            dispatch(addError(AppErrors.task.doesNotExist));
            if (ownProps.match.params.challengeId) {
              ownProps.history.push(`/browse/challenges/${ownProps.match.params.challengeId}`);
            } else {
              ownProps.history.push("/browse/challenges");
            }
            return;
          }

          const loadedTask = normalizedResults.entities.tasks[normalizedResults.result];
          const existingChallenge = existingTask?.parent;
          // Load the parent challenge if missing or stale
          if (!_isPlainObject(existingChallenge) || isStale(existingChallenge, CHALLENGE_STALE)) {
            dispatch(fetchChallenge(loadedTask.parent)).then((normalizedChallengeResults) => {
              const existingProject = existingChallenge?.parent;
              // Load the parent project if missing or stale
              if (!_isPlainObject(existingProject) || isStale(existingProject, PROJECT_STALE)) {
                fetchParentProject(dispatch, normalizedChallengeResults);
              }
            });
          } else if (!existingChallenge.parent && Number.isFinite(projectId)) {
            // Directly load the project by identifier
            dispatch(fetchProject(projectId));
          }

          // Fetch the task comments and location data, but don't wait for them
          dispatch(fetchTaskComments(taskId));
          dispatch(fetchTaskPlace(loadedTask));
          dispatch(fetchChallenge(loadedTask.parent));
          dispatch(fetchChallengeActions(loadedTask.parent));

          return normalizedResults;
        })
        .catch(() => {
          if (forReview) {
            dispatch(addError(AppErrors.reviewTask.alreadyClaimed));
          } else {
            dispatch(addError(AppErrors.task.fetchFailure));
          }
        });
    },

    /**
     * Invoke to mark a task as complete with the given status
     */
    completeTask: async (
      task,
      challengeId,
      taskStatus,
      comment,
      tags,
      taskLoadBy,
      userId,
      needsReview,
      requestedNextTask,
      osmComment,
      tagEdits,
      completionResponses,
      taskBundle,
    ) => {
      const taskId = task.id;

      // Work to be done after the status is set
      const doAfter = () =>
        new Promise(async (resolve) => {
          const parallelTasks = [];

          // Handle comment
          if (_isString(comment) && comment.length > 0) {
            if (taskBundle) {
              parallelTasks.push(
                dispatch(
                  addTaskBundleComment(
                    taskBundle.bundleId,
                    AsMappableBundle(taskBundle).primaryTaskId() || taskId,
                    comment,
                    taskStatus,
                  ),
                ),
              );
            } else {
              parallelTasks.push(dispatch(addTaskComment(taskId, comment, taskStatus)));
            }
          }

          // Update the user in the background to get their latest score
          parallelTasks.push(dispatch(fetchUser(userId)));

          // Updating the challenge actions
          parallelTasks.push(dispatch(fetchChallengeActions(challengeId)));

          // Renew virtual challenge if needed
          if (Number.isFinite(ownProps.virtualChallengeId)) {
            parallelTasks.push(dispatch(renewVirtualChallenge(ownProps.virtualChallengeId)));
          }

          // Wait for all parallel tasks to complete
          await Promise.all(parallelTasks);

          // Handle next task loading - this needs to be sequential.
          // challengeIdFromRoute falls back to props.challengeId, and ownProps
          // carries one only when the route does (/challenge/:challengeId/task/
          // :taskId). On the bare /task/:taskId route it doesn't, so seed it
          // with the id the caller already handed us.
          const nextTaskProps = { ...ownProps, challengeId };
          if (taskLoadBy) {
            // Start loading the next task from the challenge.
            const loadNextTask = Number.isFinite(requestedNextTask)
              ? await nextRequestedTask(dispatch, nextTaskProps, requestedNextTask)
              : await nextRandomTask(dispatch, nextTaskProps, taskId, taskLoadBy);

            try {
              await visitNewTask(dispatch, nextTaskProps, taskId, loadNextTask);
            } catch (error) {
              ownProps.history.push(`/browse/challenges/${challengeId}`);
            }
          }
          resolve();
        });

      let cooperativeWorkSummary = null;
      if (AsCooperativeWork(task).isTagType()) {
        cooperativeWorkSummary = AsCooperativeWork(task).tagChangeSummary(tagEdits);
      }

      const completeAction = taskBundle
        ? await completeTaskBundle(
            taskBundle.bundleId,
            AsMappableBundle(taskBundle).primaryTaskId() || taskId,
            taskStatus,
            needsReview,
            tags,
            cooperativeWorkSummary,
            osmComment,
            completionResponses,
          )
        : await completeTask(
            taskId,
            taskStatus,
            needsReview,
            tags,
            cooperativeWorkSummary,
            osmComment,
            completionResponses,
          );

      await dispatch(completeAction);
      const afterResult = await doAfter();
      return afterResult;
    },

    /**
     * Move to the next task without setting any completion status, useful for
     * when a user visits a task that is already complete.
     */
    nextTask: (challengeId, taskId, taskLoadBy, comment, requestedNextTask) => {
      if (_isString(comment) && comment.length > 0) {
        dispatch(addTaskComment(taskId, comment));
      }

      // See completeTask above for why challengeId has to be seeded here
      const nextTaskProps = { ...ownProps, challengeId };
      if (taskLoadBy === TaskLoadMethod.proximity && requestedNextTask) {
        nextRequestedTask(dispatch, nextTaskProps, requestedNextTask).then((newTask) =>
          visitNewTask(dispatch, nextTaskProps, taskId, newTask),
        );
      } else {
        nextRandomTask(dispatch, nextTaskProps, taskId, taskLoadBy).then((newTask) =>
          visitNewTask(dispatch, nextTaskProps, taskId, newTask),
        );
      }
    },

    /**
     * Post a comment on the task without performing any other action
     */
    postTaskComment: (task, comment) => {
      return dispatch(addTaskComment(task.id, comment));
    },

    /**
     * Edit a comment on the task
     */
    editTaskComment: (task, commentId, newComment) => {
      return dispatch(editTaskComment(task.id, commentId, newComment));
    },

    /**
     * Update tags on task.
     */
    saveTaskTags: (task, tags) => {
      if (task.bundleId) {
        dispatch(fetchTaskBundle(task.bundleId), false).then((taskBundle) => {
          for (const task of taskBundle.tasks) {
            dispatch(updateTaskTags(task.id, tags));
          }
        });
      } else {
        dispatch(updateTaskTags(task.id, tags));
      }
    },

    saveCompletionResponses: (task, completionResponses) => {
      dispatch(updateCompletionResponses(task.id, completionResponses));
    },

    fetchOSMUser,
    fetchOSMData: (bbox) => {
      return fetchOSMData(bbox).catch((error) => {
        dispatch(addError(error));
        throw error;
      });
    },

    fetchOSMElementHistory,
    fetchOSMElement,
  };
};

/**
 * Retrieve the task id from the route, falling back to the given defaultId if
 * none is available.
 */
export const taskIdFromRoute = (props, defaultId) => {
  const taskId = parseInt(props.match?.params?.taskId, 10);
  return Number.isFinite(taskId) ? taskId : defaultId;
};

/**
 * Retrieve the challenge id from the route, falling back to the given
 * defaultId if none is available.
 */
export const challengeIdFromRoute = (props, defaultId) => {
  const challengeId = parseInt(props.match?.params?.challengeId, 10);

  return Number.isFinite(challengeId) ? challengeId : defaultId;
};

/**
 * Returns true if the at least staleTime milliseconds has elapsed since
 * the given entity was last fetched from the server, false otherwise
 */
export const isStale = (entity, staleTime) => {
  return Date.now() - (entity?._meta?.fetchedAt ?? 0) > staleTime;
};

/**
 * Load a new random task, handling the differences between standard challenges
 * and virtual challenges.
 */
export const nextRandomTask = async (dispatch, props, currentTaskId, taskLoadBy) => {
  // We need to make different requests depending on whether we're working on a
  // virtual challenge or a standard challenge.
  if (Number.isFinite(props.virtualChallengeId)) {
    return dispatch(
      loadRandomTaskFromVirtualChallenge(
        props.virtualChallengeId,
        taskLoadBy === TaskLoadMethod.proximity ? currentTaskId : undefined,
      ),
    );
  } else {
    return dispatch(
      loadRandomTaskFromChallenge(
        challengeIdFromRoute(props, props.challengeId),
        taskLoadBy === TaskLoadMethod.proximity ? currentTaskId : undefined,
      ),
    );
  }
};

/**
 * Load and lock a requested next task
 */
export const nextRequestedTask = function (dispatch, props, requestedTaskId) {
  const taskFrom = (normalizedResults) =>
    normalizedResults?.entities?.tasks?.[normalizedResults.result];

  return dispatch(fetchTask(requestedTaskId)).then((fetched) => {
    // Skip the lock for tasks that can't be worked on - the user gets only one
    // at a time, and WithLockedTask won't take one for these either
    if (!isLockableTask(taskFrom(fetched))) {
      return taskFrom(fetched);
    }

    return dispatch(startTask(requestedTaskId)).then(
      (started) => taskFrom(started) ?? taskFrom(fetched),
    );
  });
};

/**
 * Route to the given new task. If there's no new task, we assume the challenge
 * is complete and congratulate the user.
 */
export const visitNewTask = function (dispatch, props, currentTaskId, newTask) {
  if (_isPlainObject(newTask) && newTask.id !== currentTaskId) {
    // The route we use is different for virtual challenges vs standard
    // challenges.
    if (Number.isFinite(props.virtualChallengeId)) {
      props.history.push(`/virtual/${props.virtualChallengeId}/task/${newTask.id}`);
    } else {
      const challengeId = challengeIdFromRoute(props, props.challengeId);
      props.history.push(`/challenge/${challengeId}/task/${newTask.id}`);
    }
    return Promise.resolve();
  } else {
    // If challenge is complete, redirect home with note to congratulate user
    if (Number.isFinite(props.virtualChallengeId)) {
      // We don't get a status for virtual challenges, so just assume we're done
      props.history.push("/browse/challenges", {
        congratulate: true,
        warn: false,
      });
      return Promise.resolve();
    } else {
      const challengeId = challengeIdFromRoute(props, props.challengeId);
      return dispatch(fetchChallenge(challengeId)).then((normalizedResults) => {
        const challenge = normalizedResults.entities.challenges[normalizedResults.result];
        if (challenge.status === CHALLENGE_STATUS_FINISHED) {
          props.history.push("/browse/challenges", {
            congratulate: true,
            warn: false,
          });
        } else {
          props.history.push("/browse/challenges", {
            warn: true,
            congratulate: false,
          });
        }
      });
    }
  }
};

export default WithCurrentTask;
