import _omit from "lodash/omit";
import { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import AsCooperativeWork from "../../../interactions/Task/AsCooperativeWork";
import { addError } from "../../../services/Error/Error";
import { getLockConflict } from "../../../services/Task/LockConflict";
import {
  bundleTasks,
  deleteTaskBundle,
  fetchTaskBundle,
  lockTaskBundle,
  releaseTask,
  updateTaskBundle,
} from "../../../services/Task/Task";
import { isFinalStatus } from "../../../services/Task/TaskStatus/TaskStatus";

/**
 * WithTaskBundle passes down methods for creating new task bundles and
 * updating existing ones, as well as tracking a current bundle
 *
 * @author [Neil Rotstan](https://github.com/nrotstan)
 */
export function WithTaskBundle(WrappedComponent) {
  return class extends Component {
    state = {
      initialBundle: null,
      taskBundle: null,
      bundleEditsDisabled: false,
      bundlingDisabledReason: null,
      selectedTasks: [],
      resetSelectedTasks: null,
      loading: false,
      updateTaskBundleError: false,
      lockConflict: null,
      pendingMemberIds: null,
    };

    async componentDidMount() {
      const { task } = this.props;
      if (Number.isFinite(task?.bundleId)) {
        await this.fetchBundle(task.bundleId);
      }

      this.updateBundlingConditions();
    }

    async componentDidUpdate(prevProps) {
      const { task } = this.props;

      if (task && task?.id !== prevProps?.task?.id) {
        // The previous bundle's covering lock is deliberately left in place -
        // releasing it is always an explicit user action (see WithLockedTask).
        this.setState({
          selectedTasks: [],
          taskBundle: null,
          initialBundle: null,
          loading: false,
          error: null,
          lockConflict: null,
          pendingMemberIds: null,
        });
        if (Number.isFinite(task?.bundleId)) {
          await this.fetchBundle(task.bundleId);
        }
        this.updateBundlingConditions();
      } else if (this.props.taskReadOnly !== prevProps.taskReadOnly) {
        // Read-only status is one of the bundling conditions, so it has to be
        // reevaluated whenever the lock is acquired or lost
        this.updateBundlingConditions();
      }
    }

    /**
     * Looks up full task data for the given ids from the redux tasks entity
     * store (already populated by whatever loaded the map/cluster data the
     * user selected these tasks from). The lockTaskBundle response only
     * confirms lock/membership, not task data, so this is how taskBundle.tasks
     * gets hydrated for tasks that aren't part of an already-fetched bundle.
     */
    hydrateTasks = (taskIds) => {
      return taskIds.map((id) => this.props.taskEntities?.[id]).filter(Boolean);
    };

    fetchBundle = async (bundleId) => {
      const { task, workspace, history, fetchTaskBundle } = this.props;
      this.setState({ loading: true });

      try {
        const taskBundle = await fetchTaskBundle(bundleId, !this.state.bundleEditsDisabled);
        this.handlePrimaryTaskRedirect(taskBundle, task, workspace, history);

        this.setState({
          taskBundle,
          initialBundle: taskBundle,
          selectedTasks: taskBundle?.taskIds || [],
        });

        if (this.props.selectTasks && taskBundle?.tasks) {
          if (this.props.resetSelectedTasks) {
            await this.props.resetSelectedTasks();
          }

          this.props.selectTasks(taskBundle.tasks);
        }

        this.updateBundlingConditions();

        // Fetching a bundle no longer locks it server-side (bundles are locked
        // as a single covering row on the primary task, established only via
        // lockTaskBundle) - explicitly (re)establish that membership so bundle
        // members are actually protected while this user is viewing/editing it.
        if (!this.props.taskReadOnly && taskBundle) {
          const memberTaskIds = taskBundle.taskIds.filter((id) => id !== task?.id);
          await this.syncBundleLock(memberTaskIds);
        }
      } catch (error) {
        console.error("Error fetching bundle:", error);
      } finally {
        this.setState({ loading: false });
      }
    };

    updateBundlingConditions = () => {
      const { task, taskReadOnly, workspace, user, name } = this.props;

      try {
        const workspaceName = workspace?.name || name;
        const isCompletionWorkspace = ["taskCompletion"].includes(workspaceName);
        let reason = null;
        let bundleEditsDisabled = false;

        switch (true) {
          case !isCompletionWorkspace:
            reason = "workspace";
            bundleEditsDisabled = true;
            break;

          case taskReadOnly === true && !isFinalStatus(task?.status):
            reason = "readOnly";
            bundleEditsDisabled = true;
            break;

          case task?.lockedBy && task.lockedBy !== user.id:
            reason = "locked";
            bundleEditsDisabled = true;
            break;

          case task &&
            AsCooperativeWork &&
            (AsCooperativeWork(task).isCooperative() || AsCooperativeWork(task).isTagType()):
            reason = "taskType";
            bundleEditsDisabled = true;
            break;

          case !(task?.reviewStatus === 2 || [0, 3, 6].includes(task?.status)):
            reason = "doneOrReview";
            bundleEditsDisabled = true;
            break;

          default:
            // Check mapper edit permissions
            const hasNoCompletion = !task?.completedBy;
            const isTaskCompleter = user.id === task?.completedBy;
            const enableMapperEdits = hasNoCompletion || isTaskCompleter || user.isSuperUser;
            const isReviewCompleted = task?.reviewStatus === 2;
            const isTaskCompleted = [0, 3, 6].includes(task?.status);
            const completionStatus = isReviewCompleted || isTaskCompleted;

            if (!(enableMapperEdits && completionStatus)) {
              reason = "mapperEdits";
              bundleEditsDisabled = true;
            }
            break;
        }

        this.setState({
          bundleEditsDisabled,
          bundlingDisabledReason: reason,
        });
      } catch (error) {
        console.error("Error in updateBundlingConditions:", error);
        this.setState({
          bundleEditsDisabled: true,
          bundlingDisabledReason: "error",
        });
      }
    };

    handlePrimaryTaskRedirect = (taskBundle, task, workspace, history) => {
      // Exit early if this is already the primary task
      if (task.isBundlePrimary) {
        return;
      }

      // Find the primary task
      const primaryTask = taskBundle.tasks.find((task) => task.isBundlePrimary);
      if (!primaryTask) {
        console.error("Primary task not found in task bundle.");
        return;
      }

      // Determine if we're in meta-review
      const currentPath = history?.location?.pathname;
      const isMetaReview = currentPath ? currentPath.includes("meta-review") : false;

      // Determine the location suffix
      let location = "";
      if (workspace?.name === "taskReview") {
        location = isMetaReview ? "/meta-review" : "/review";
      }

      // Perform the redirect
      const redirectPath = `/challenge/${primaryTask.parent}/task/${primaryTask.id}${location}`;
      history.push(redirectPath);
    };

    resetSelectedTasks = () => {
      if (this.state.resetSelectedTasks) {
        this.state.resetSelectedTasks();
      }
    };

    /**
     * Locks the bundle's primary task with the given member task ids as its
     * full desired membership (replacing whatever it covered before) - the
     * single source of truth for "what's in this bundle right now" is always
     * the covering lock's membership, not a per-task lock/unlock call.
     *
     * On a one-lock-per-user conflict (409), records it in lockConflict/
     * pendingMemberIds (for a later releaseConflictingLockAndRetry) instead of
     * the generic "lockError".
     */
    syncBundleLock = async (memberTaskIds) => {
      const { task } = this.props;

      try {
        await this.props.lockTaskBundle(task.id, memberTaskIds);
        this.setState({ lockConflict: null, pendingMemberIds: null });
        return true;
      } catch (error) {
        const conflict = getLockConflict(error);
        if (conflict) {
          this.setState({ lockConflict: conflict, pendingMemberIds: memberTaskIds });
        } else {
          console.error("Error locking task bundle:", error);
          this.setState({ error: "lockError" });
        }
        return false;
      }
    };

    createTaskBundle = async (taskIds) => {
      if (taskIds.length > 50) {
        this.setState({ bundleLimitError: true });
        return false;
      }

      this.setState({ loading: true, error: null });

      const memberTaskIds = taskIds.filter((taskId) => taskId !== this.props.task?.id);

      if (memberTaskIds.length === 0) {
        this.setState({ loading: false });
        return false;
      }

      const locked = await this.syncBundleLock(memberTaskIds);
      if (!locked) {
        this.setState({ loading: false });
        return false;
      }

      this.setState({
        loading: false,
        taskBundle: {
          tasks: [this.props.task, ...this.hydrateTasks(memberTaskIds)],
          taskIds,
        },
      });
      return true;
    };

    addTaskToBundle = async (taskId) => {
      this.setState({ loading: true, error: null });

      const currentMemberIds = this.state.taskBundle.taskIds.filter(
        (id) => id !== this.props.task?.id,
      );
      const updatedMemberIds = [...currentMemberIds, taskId];

      const locked = await this.syncBundleLock(updatedMemberIds);
      if (!locked) {
        this.setState({ loading: false });
        return false;
      }

      this.setState((prevState) => ({
        loading: false,
        taskBundle: {
          ...prevState.taskBundle,
          tasks: [...prevState.taskBundle.tasks, ...this.hydrateTasks([taskId])],
          taskIds: [...prevState.taskBundle.taskIds, taskId],
        },
      }));
      return true;
    };

    removeTaskFromBundle = async (taskId) => {
      const { taskBundle, initialBundle } = this.state;

      const updatedTaskIds = taskBundle.taskIds.filter((id) => id !== taskId);
      const updatedMemberIds = updatedTaskIds.filter((id) => id !== this.props.task?.id);

      // Only tasks added during this live editing session (not yet part of the
      // persisted bundle) need their lock released immediately - a task removed
      // from an already-persisted bundle is handled server-side when the bundle
      // update is actually submitted.
      const wasPersisted = initialBundle?.taskIds?.includes(taskId) ?? false;
      if (!wasPersisted) {
        const locked = await this.syncBundleLock(updatedMemberIds);
        if (!locked) {
          return false;
        }
      }

      if (taskBundle.taskIds.length <= 2) {
        this.setState({
          taskBundle: null,
          selectedTasks: [],
        });
        return true;
      }

      const updatedTasks = taskBundle.tasks.filter((task) => task.id !== taskId);

      this.setState({
        taskBundle: {
          ...taskBundle,
          taskIds: updatedTaskIds,
          tasks: updatedTasks,
        },
        selectedTasks: updatedTaskIds,
      });

      return true;
    };

    clearActiveTaskBundle = async () => {
      const { initialBundle } = this.state;
      const memberTaskIdsToKeep = (initialBundle?.taskIds || []).filter(
        (taskId) => taskId !== this.props.task?.id,
      );

      await this.syncBundleLock(memberTaskIdsToKeep);

      this.setState({
        selectedTasks: [],
        taskBundle: null,
      });
      this.resetSelectedTasks();
    };

    resetTaskBundle = () => {
      this.setState({
        selectedTasks: this.state.initialBundle?.taskIds,
        taskBundle: this.state.initialBundle,
      });
    };

    updateTaskBundle = async () => {
      const { taskBundle, initialBundle } = this.state;
      if (taskBundle || initialBundle) {
        try {
          this.setState({ updateTaskBundleError: false });

          if (!taskBundle && initialBundle) {
            await this.props.deleteTaskBundle(initialBundle?.bundleId);
            return null;
          }

          if (taskBundle && initialBundle) {
            return await this.props.updateTaskBundle(initialBundle, taskBundle.taskIds);
          }

          return await this.props.bundleTasks(this.props.taskId, taskBundle.taskIds);
        } catch (error) {
          console.error("Error updating task bundle:", error);
          this.setState({ updateTaskBundleError: true });
        }
      }
      return null;
    };

    releaseConflictingLockAndRetry = async () => {
      const { lockConflict, pendingMemberIds } = this.state;
      if (!lockConflict) {
        return false;
      }

      try {
        await this.props.releaseTask(lockConflict.lockedTaskId);
      } catch (error) {
        console.warn("Error releasing conflicting lock:", error);
      }

      return this.syncBundleLock(pendingMemberIds || []);
    };

    clearLockConflict = () => {
      this.setState({ lockConflict: null, pendingMemberIds: null });
    };

    render() {
      return (
        <WrappedComponent
          {..._omit(this.props, [
            "bundleTasks",
            "deleteTaskBundle",
            "updateTaskBundle",
            "removeTaskFromBundle",
            "lockTaskBundle",
            "releaseTask",
            "taskEntities",
          ])}
          taskBundle={this.state.taskBundle}
          initialBundle={this.state.initialBundle}
          taskBundleLoading={this.state.loading}
          createTaskBundle={this.createTaskBundle}
          updateTaskBundle={this.updateTaskBundle}
          resetTaskBundle={this.resetTaskBundle}
          removeTaskFromBundle={this.removeTaskFromBundle}
          addTaskToBundle={this.addTaskToBundle}
          clearActiveTaskBundle={this.clearActiveTaskBundle}
          setSelectedTasks={(selectedTasks) => this.setState({ selectedTasks })}
          selectedTasks={this.state.selectedTasks}
          bundleEditsDisabled={this.state.bundleEditsDisabled}
          setResetSelectedTasksAccessor={(f) => this.setState({ resetSelectedTasks: f })}
          resetSelectedTasks={this.resetSelectedTasks}
          error={this.state.error}
          bundlingDisabledReason={this.state.bundlingDisabledReason}
          lockConflict={this.state.lockConflict}
          releaseConflictingLockAndRetry={this.releaseConflictingLockAndRetry}
          clearLockConflict={this.clearLockConflict}
        />
      );
    }
  };
}

export const mapStateToProps = (state) => ({
  taskEntities: state.entities?.tasks,
});

export const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      fetchTaskBundle,
      bundleTasks,
      deleteTaskBundle,
      updateTaskBundle,
      lockTaskBundle,
      releaseTask,
      addError,
    },
    dispatch,
  );

export default (WrappedComponent) =>
  connect(mapStateToProps, mapDispatchToProps)(WithTaskBundle(WrappedComponent));
