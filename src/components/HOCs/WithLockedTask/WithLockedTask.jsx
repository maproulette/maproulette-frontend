import _omit from "lodash/omit";
import { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { getLockConflict } from "../../../services/Task/LockConflict";
import {
  refreshTaskLock,
  releaseTask,
  requestUnlock,
  startTask,
} from "../../../services/Task/Task";
import { isLockableTask } from "../../../services/Task/TaskLock";

// Used for lock storage events. Users will be locked from other task tabs
// if logging out, signing back in, or have multiple tabs on one task
const lockStorage = {
  setLock: (taskId) => {
    localStorage.setItem(`lock-${taskId}`, true);
  },

  removeLock: (taskId) => {
    localStorage.removeItem(`lock-${taskId}`);
  },

  isLocked: (taskId) => {
    const isLocked = localStorage.getItem(`lock-${taskId}`);

    if (isLocked) {
      return true;
    }

    return false;
  },
};

/**
 * WithLockedTask provides a means of locking and unlocking a task the user is
 * about to work on. If a lock cannot be acquired, the WrappedCompont will be
 * passed a `taskReadOnly` flag set to true
 *
 * Locks are only ever released intentionally: via the lock dialog, the locked
 * tasks widget, a lock-conflict release, or a server-side release on task
 * completion/skip. Merely navigating away from (or closing) a task keeps the
 * lock, leaving the user's work claimed until they release it or it expires.
 *
 * @author [Kelli Rotstan](https://github.com/krotstan)
 */
const WithLockedTask = function (WrappedComponent) {
  return class extends Component {
    state = {
      readOnly: false,
      tryingLock: false,
      failureDetails: null,
      lockedAt: null,
      lockConflict: null,
      releasingConflict: false,
      lockNotApplicable: false,
    };

    lockTask = (task) => {
      if (!task) {
        return Promise.reject("Invalid task");
      }

      if (!isLockableTask(task, this.props.challenge)) {
        // Read-only, but not a failure: there's no lock to offer to retry or
        // request, so flag it separately from a genuine lock failure
        this.setState({
          readOnly: true,
          tryingLock: false,
          failureDetails: null,
          lockConflict: null,
          lockedAt: null,
          lockNotApplicable: true,
        });
        lockStorage.removeLock(task.id);
        return Promise.resolve(false);
      }

      this.setState({
        tryingLock: true,
        failureDetails: null,
        lockConflict: null,
        lockNotApplicable: false,
      });
      return this.props
        .startTask(task.id)
        .then(() => {
          if (this.state.readOnly) {
            this.setState({ readOnly: false });
          }

          this.setState({ tryingLock: false, lockedAt: Date.now() });

          lockStorage.setLock(task.id);

          return true;
        })
        .catch((err) => {
          this.setState({
            readOnly: true,
            tryingLock: false,
            failureDetails: err.details,
            lockConflict: getLockConflict(err),
          });
          return false;
        });
    };

    /**
     * Releases the task the user already holds a lock on elsewhere (per a
     * one-lock-per-user 409 conflict), then retries locking the given task.
     *
     * Exposed as `releaseConflictingTaskLockAndRetry` (and the conflict itself
     * as `taskLockConflict`) rather than the plainer names: WithTaskBundle
     * tracks its own, separate bundle-lock conflict under `lockConflict` and
     * sits inside this HOC, so unnamespaced props would be clobbered by it.
     */
    releaseConflictingLockAndRetry = async (task) => {
      const conflictTaskId = this.state.lockConflict?.lockedTaskId;
      if (!conflictTaskId) {
        return false;
      }

      this.setState({ releasingConflict: true });
      try {
        await this.props.releaseTask(conflictTaskId);
      } catch (error) {
        console.warn("Error releasing conflicting lock:", error);
      } finally {
        this.setState({ releasingConflict: false });
      }

      return this.lockTask(task);
    };

    /**
     * Explicitly release the lock on the given task. Only ever called in
     * response to a deliberate user action - see the class doc above.
     */
    unlockTask = (task) => {
      if (!task) {
        return Promise.reject("Invalid task");
      }

      const release = this.props
        .releaseTask(task.id)
        .then(() => {
          //wait for lock to be cleared in db and provide some leeway
          //time with setTimeout before triggering storage event
          setTimeout(() => lockStorage.removeLock(task.id), 1500);
          return true;
        })
        .catch(() => false);

      this.setState({ lockedAt: null });

      return release;
    };

    requestUnlock = (taskId) => {
      this.props.requestUnlock(taskId);
    };

    /**
     * Refresh the lock on the task, extending its allowed duration
     */
    refreshTaskLock = (task) => {
      if (!task) {
        return Promise.reject("Invalid task");
      }

      if (!isLockableTask(task, this.props.challenge)) {
        return Promise.resolve(false);
      }

      return this.props
        .refreshTaskLock(task.id)
        .then(() => {
          if (this.state.readOnly) {
            this.setState({ readOnly: false, failureDetails: null, lockConflict: null });
          }

          this.setState({ lockedAt: Date.now() });

          lockStorage.setLock(task.id);

          return true;
        })
        .catch((err) => {
          // A refresh can hit the same one-lock-per-user conflict an initial
          // lock can (e.g. the user grabbed a lock elsewhere in the meantime),
          // so surface it the same way and let the conflict dialog handle it
          this.setState({
            readOnly: true,
            failureDetails: err.details,
            lockConflict: getLockConflict(err),
          });
          return false;
        });
    };

    syncLocks = () => {
      const { task } = this.props;

      if (task && isLockableTask(task, this.props.challenge)) {
        if (!lockStorage.isLocked(task.id)) {
          this.refreshTaskLock(task);
        }
      }
    };

    componentDidMount() {
      const { task } = this.props;

      if (task) {
        this.lockTask(task);
      }

      window.addEventListener("storage", this.syncLocks);
    }

    componentDidUpdate(prevProps) {
      if (prevProps?.task?.id !== this.props.task?.id) {
        // The lock on the previous task is deliberately left in place - releasing
        // a lock is always an explicit user action. If the previous lock is still
        // held, locking this task reports a lock conflict and the wrapped
        // component can offer to release it (releaseConflictingLockAndRetry).
        if (this.props.task) {
          this.lockTask(this.props.task);
        }
      }
    }

    componentWillUnmount() {
      const { task } = this.props;
      window.removeEventListener("storage", this.syncLocks);

      // Only the local tab bookkeeping is cleared here; the lock itself stays
      // until the user releases it (or it expires server-side).
      if (task) {
        lockStorage.removeLock(task.id);
      }
    }

    render() {
      return (
        <WrappedComponent
          {..._omit(this.props, ["startTask", "releaseTask"])}
          taskReadOnly={this.state.readOnly}
          tryingLock={this.state.tryingLock}
          lockFailureDetails={this.state.failureDetails}
          taskLockedAt={this.state.lockedAt}
          tryLocking={this.lockTask}
          unlockTask={this.unlockTask}
          refreshTaskLock={this.refreshTaskLock}
          requestUnlock={this.requestUnlock}
          taskLockNotApplicable={this.state.lockNotApplicable}
          taskLockConflict={this.state.lockConflict}
          releasingTaskLockConflict={this.state.releasingConflict}
          releaseConflictingTaskLockAndRetry={this.releaseConflictingLockAndRetry}
        />
      );
    }
  };
};

export const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ startTask, releaseTask, refreshTaskLock, requestUnlock }, dispatch);

export default (WrappedComponent) =>
  connect(null, mapDispatchToProps)(WithLockedTask(WrappedComponent));
