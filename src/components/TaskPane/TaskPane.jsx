import classNames from "classnames";
import _findIndex from "lodash/findIndex";
import PropTypes from "prop-types";
import { Component, Fragment, useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FormattedMessage, injectIntl, useIntl } from "react-intl";
import { Redirect } from "react-router";
import AsManager from "../../interactions/User/AsManager";
import { isCompletionStatus } from "../../services/Task/TaskStatus/TaskStatus";
import { WidgetDataTarget, generateWidgetId, widgetDescriptor } from "../../services/Widget/Widget";
import { constructChallengeLink } from "../../utils/constructChangesetUrl";
import BasicDialog from "../BasicDialog/BasicDialog";
import BusySpinner from "../BusySpinner/BusySpinner";
import ChallengeNameLink from "../ChallengeNameLink/ChallengeNameLink";
import OwnerContactLink, {
  JoinChallengeDiscussionLink,
} from "../ChallengeOwnerContactLink/ChallengeOwnerContactLink";
import Dropdown from "../Dropdown/Dropdown";
import MapPane from "../EnhancedMap/MapPane/MapPane";
import WithChallengePreferences from "../HOCs/WithChallengePreferences/WithChallengePreferences";
import WithCooperativeWork from "../HOCs/WithCooperativeWork/WithCooperativeWork";
import WithCurrentUser from "../HOCs/WithCurrentUser/WithCurrentUser";
import WithKeyboardShortcuts from "../HOCs/WithKeyboardShortcuts/WithKeyboardShortcuts";
import WithLockedTask from "../HOCs/WithLockedTask/WithLockedTask";
import WithTaskBundle from "../HOCs/WithTaskBundle/WithTaskBundle";
import WithWidgetWorkspaces from "../HOCs/WithWidgetWorkspaces/WithWidgetWorkspaces";
import MediaQuery from "../MediaQuery/MediaQuery";
import SvgSymbol from "../SvgSymbol/SvgSymbol";
import WidgetWorkspace from "../WidgetWorkspace/WidgetWorkspace";
import TaskMapWidget from "../Widgets/TaskMapWidget/TaskMapWidget";
import messages from "./Messages";
import MobileTaskDetails from "./MobileTaskDetails/MobileTaskDetails";
import TaskMap from "./TaskMap/TaskMap";

// Setup child components with necessary HOCs
const MobileTabBar = WithCurrentUser(MobileTaskDetails);
const EnhancedTaskMapWidget = WithKeyboardShortcuts(TaskMapWidget);

const WIDGET_WORKSPACE_NAME = "taskCompletion";

// How frequently the task lock should be refreshed
const LOCK_REFRESH_INTERVAL = 600000; // 10 minutes

// How long a task lock lasts before it expires server-side. Mirrors the
// backend's default `maproulette.task.lock.expiry` setting, which isn't
// currently exposed to the frontend via the API.
const TASK_LOCK_DURATION = 3600000; // 1 hour

/**
 * A single button combining the lock icon with a live countdown of how much
 * time remains before the current user's lock on the task expires. Clicking
 * it opens a dialog letting the user extend or release the lock.
 */
const TaskLockButton = ({ lockedAt, title, onClick }) => {
  const intl = useIntl();
  const remainingTime = () =>
    lockedAt ? Math.max(0, lockedAt + TASK_LOCK_DURATION - Date.now()) : 0;
  const [remainingMs, setRemainingMs] = useState(remainingTime());

  useEffect(() => {
    if (!lockedAt) {
      return;
    }

    setRemainingMs(remainingTime());
    const intervalId = setInterval(() => setRemainingMs(remainingTime()), 1000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedAt]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isExpired = lockedAt && totalSeconds <= 0;

  const ariaLabel = !lockedAt
    ? title
    : isExpired
      ? intl.formatMessage(messages.taskLockExpiredAriaLabel)
      : intl.formatMessage(messages.taskLockCountdownAriaLabel, {
          time: `${minutes}:${seconds.toString().padStart(2, "0")}`,
        });

  return (
    <button
      type="button"
      onClick={onClick}
      className="mr-flex mr-items-center mr-text-green-lighter hover:mr-text-current mr-mr-4"
      title={title}
      aria-label={ariaLabel}
    >
      {lockedAt && (
        <span className="mr-text-xs mr-tabular-nums mr-mr-2">
          {isExpired ? (
            <FormattedMessage {...messages.taskLockExpiredLabel} />
          ) : (
            `${minutes}:${seconds.toString().padStart(2, "0")}`
          )}
        </span>
      )}
      <SvgSymbol sym="locked-icon" viewBox="0 0 20 20" className="mr-w-4 mr-h-4 mr-fill-current" />
    </button>
  );
};

export const defaultWorkspaceSetupClassic = function (intl) {
  return {
    dataModelVersion: 2,
    name: WIDGET_WORKSPACE_NAME,
    label: intl
      ? intl.formatMessage(messages.taskCompletionLabel)
      : messages.taskCompletionLabel.defaultMessage,
    type: "classic",
    widgets: [
      widgetDescriptor("TaskInstructionsWidget"),
      widgetDescriptor("TagDiffWidget"),
      widgetDescriptor("TaskMapWidget"),
      widgetDescriptor("TaskCompletionWidget"),
      widgetDescriptor("TaskLocationWidget"),
    ],
    layout: [
      { i: generateWidgetId(), x: 0, y: 0, w: 4, h: 4 },
      { i: generateWidgetId(), x: 4, y: 0, w: 8, h: 5 },
      { i: generateWidgetId(), x: 4, y: 5, w: 8, h: 21 },
      { i: generateWidgetId(), x: 0, y: 4, w: 4, h: 7 },
      { i: generateWidgetId(), x: 0, y: 11, w: 4, h: 8 },
    ],
    permanentWidgets: [
      // Cannot be removed from workspace
      "TaskMapWidget",
      "TaskCompletionWidget",
      "TagDiffWidget",
    ],
    excludeWidgets: [
      // Cannot be added to workspace
      "TaskReviewWidget",
    ],
    conditionalWidgets: [
      // conditionally displayed
      "TagDiffWidget",
    ],
  };
};

export const defaultWorkspaceSetupLeftPanel = function (intl, type = "leftPanel") {
  return {
    dataModelVersion: 2,
    name: WIDGET_WORKSPACE_NAME,
    label: intl
      ? intl.formatMessage(messages.taskCompletionLabelStaticMap)
      : messages.taskCompletionLabelStaticMap.defaultMessage,
    type,
    widgets: [
      widgetDescriptor("TaskInstructionsWidget"),
      widgetDescriptor("TagDiffWidget"),
      widgetDescriptor("TaskCompletionWidget"),
      widgetDescriptor("TaskLocationWidget"),
    ],
    layout: [
      { i: generateWidgetId(), x: 0, y: 0, w: 4, h: 4 },
      { i: generateWidgetId(), x: 4, y: 0, w: 4, h: 5 },
      { i: generateWidgetId(), x: 0, y: 4, w: 4, h: 9 },
      { i: generateWidgetId(), x: 0, y: 11, w: 4, h: 8 },
    ],
    permanentWidgets: ["TaskCompletionWidget", "TagDiffWidget"],
    excludeWidgets: ["TaskReviewWidget", "TaskMapWidget"],
    conditionalWidgets: ["TagDiffWidget"],
  };
};

/**
 * TaskPane presents the current task being actively worked upon. It contains
 * an WidgetWorkspace with information and controls, including a TaskMap
 * displaying the appropriate map and task geometries.
 *
 * @author [Neil Rotstan](https://github.com/nrotstan)
 */
export class TaskPane extends Component {
  lockRefreshInterval = null;

  state = {
    /**
     * id of task once user initiates completion. This is used to help our
     * animation transitions.
     */
    completionResponses: null,
    showLockFailureDialog: false,
    needsResponses: false,
    completingTask: false,
    unlockRequested: false,
    showLockOptionsDialog: false,
    extendingLock: false,
  };

  tryLockingTask = () => {
    this.props.tryLocking(this.props.task).then((success) => {
      this.setState({ showLockFailureDialog: !success });
    });
  };

  clearLockFailure = () => {
    this.setState({ showLockFailureDialog: false });
  };

  openLockOptionsDialog = () => {
    this.setState({ showLockOptionsDialog: true });
  };

  closeLockOptionsDialog = () => {
    this.setState({ showLockOptionsDialog: false });
  };

  extendTaskLock = () => {
    this.setState({ extendingLock: true });
    this.props.refreshTaskLock(this.props.task).then(() => {
      this.setState({ extendingLock: false, showLockOptionsDialog: false });
    });
  };

  /**
   * Clear the lock-refresh timer if one is set
   */
  clearLockRefreshInterval = () => {
    if (this.lockRefreshInterval !== null) {
      clearInterval(this.lockRefreshInterval);
      this.lockRefreshInterval = null;
    }
  };

  /**
   * Invoked by various completion controls to signal the user is completing
   * the task with a specific status. Normally this would just go straight to
   * WithCurrentTask, but we intercept the call so that we can manage our
   * transition animation as the task prepares to complete.
   */
  completeTask = async (
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
    taskBundle,
  ) => {
    try {
      await this.props.completeTask(
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
        this.state.completionResponses,
        taskBundle,
      );
    } catch (error) {
      console.error("Error completing task:", error);
      throw error;
    }
  };

  setCompletionResponse = (propertyName, value) => {
    const responses = this.state.completionResponses
      ? Object.assign({}, this.state.completionResponses)
      : JSON.parse(this.props.task?.completionResponses ?? "{}");

    responses[propertyName] = value;
    this.setState({ completionResponses: responses });
  };

  setNeedsResponses = (needsResponses) => {
    if (needsResponses !== this.state.needsResponses) {
      this.setState({ needsResponses });
    }
  };

  componentDidMount() {
    // Setup an interval to refresh the task lock every so often so that it
    // doesn't expire while the mapper is actively working on the task
    this.clearLockRefreshInterval();
    this.lockRefreshInterval = setInterval(() => {
      this.props.refreshTaskLock(this.props.task).then((success) => {
        if (!success) {
          this.setState({ showLockFailureDialog: true });
        }
      });
    }, LOCK_REFRESH_INTERVAL);
  }

  componentWillUnmount() {
    this.clearLockRefreshInterval();
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.location.pathname !== prevProps.location.pathname &&
      this.props.location.search !== prevProps.location.search
    ) {
      window.scrollTo(0, 0);
    }

    if (this.props.task?.id !== prevProps?.task?.id) {
      this.setState({ completionResponses: null });
    }

    if (this.props.taskReadOnly && !prevProps.taskReadOnly) {
      this.setState({ showLockFailureDialog: true });
    }
  }

  render() {
    // Render public task page if user is not logged in.
    if (!this.props.user) {
      return this.props.checkingLoginStatus ? (
        <div className="mr-flex mr-justify-center mr-py-8 mr-w-full mr-bg-blue">
          <BusySpinner />
        </div>
      ) : (
        <Redirect to={`${this.match.url}`} />
      );
    }

    if (!this.props.task?.parent?.parent) {
      return (
        <div className="pane-loading full-screen-height">
          <BusySpinner />
        </div>
      );
    }

    const taskInspectRoute =
      `/admin/project/${this.props.task.parent.parent.id}/` +
      `challenge/${this.props.task.parent.id}/task/${this.props.task.id}/inspect`;

    const isManageable = AsManager(this.props.user).canManageChallenge(this.props.task?.parent);

    const completionResponses =
      this.state.completionResponses ||
      JSON.parse(this.props.task?.completionResponses ?? null) ||
      {};

    // Setup favorite/unfavorite links
    const challenge = this.props.task.parent;
    let favoriteControl = null;
    if (!challenge.isVirtual) {
      const isFavorited = _findIndex(this.props.user.savedChallenges, { id: challenge.id }) !== -1;
      favoriteControl = (
        <li>
          <a
            className="mr-normal-case mr-flex"
            onClick={() =>
              (isFavorited ? this.props.unsaveChallengeForUser : this.props.saveChallengeForUser)(
                this.props.user.id,
                challenge.id,
              )
            }
          >
            <div className="mr-text-white mr-w-4">{isFavorited && "✓"}</div>
            <FormattedMessage {...messages.favoriteLabel} />
          </a>
        </li>
      );
    }

    return (
      <div className="mr-relative">
        <MediaQuery query="(min-width: 1024px)">
          <WidgetWorkspace
            {...this.props}
            hasLeftPanelOption
            className={classNames(
              "mr-bg-gradient-r-green-dark-blue mr-text-white mr-pb-8 mr-cards-inverse",
              {
                "mr-pt-2": !this.props.inspectTask,
              },
            )}
            workspaceTitle={
              <div className="mr-flex mr-items-baseline mr-mt-4">
                <h2 className="mr-text-xl mr-my-0 mr-mr-2 mr-links-inverse">
                  <ChallengeNameLink {...this.props} includeProject suppressShareLink />
                </h2>

                {this.props.tryingLock ? (
                  <BusySpinner inline className="mr-mr-4" />
                ) : this.props.taskReadOnly ? (
                  <Dropdown
                    className="mr-dropdown--right"
                    dropdownButton={(dropdown) => (
                      <button
                        onClick={dropdown.toggleDropdownVisible}
                        className="mr-flex mr-items-center mr-text-green-lighter mr-mr-4"
                      >
                        <SvgSymbol
                          sym="unlocked-icon"
                          viewBox="0 0 60 60"
                          className="mr-w-6 mr-h-6 mr-fill-pink-light"
                        />
                      </button>
                    )}
                    dropdownContent={() => (
                      <div className="mr-links-green-lighter mr-text-sm mr-flex mr-items-center mr-mt-2">
                        <span className="mr-flex mr-items-baseline mr-text-pink-light">
                          <FormattedMessage {...messages.taskReadOnlyLabel} />
                        </span>
                        <button
                          type="button"
                          className="mr-button mr-button--xsmall mr-ml-3"
                          onClick={() => this.tryLockingTask()}
                        >
                          <FormattedMessage {...messages.taskTryLockLabel} />
                        </button>
                      </div>
                    )}
                  />
                ) : (
                  <TaskLockButton
                    lockedAt={this.props.taskLockedAt}
                    title={this.props.intl.formatMessage(messages.taskLockCountdownTitle)}
                    onClick={this.openLockOptionsDialog}
                  />
                )}

                <Dropdown
                  className="mr-dropdown--right"
                  dropdownButton={(dropdown) => (
                    <button
                      onClick={dropdown.toggleDropdownVisible}
                      className="mr-flex mr-items-center mr-text-green-lighter"
                    >
                      <SvgSymbol
                        sym="navigation-more-icon"
                        viewBox="0 0 20 20"
                        className="mr-fill-current mr-w-4 mr-h-4"
                      />
                    </button>
                  )}
                  dropdownContent={(dropdown) => (
                    <Fragment>
                      <ul className="mr-list-dropdown">{favoriteControl}</ul>
                      <hr className="mr-rule-dropdown" />
                      <ul className="mr-list-dropdown">
                        {Number.isFinite(this.props.virtualChallengeId) && (
                          <li>
                            <CopyToClipboard
                              text={`${window.env.REACT_APP_URL}/browse/virtual/${this.props.virtualChallengeId}`}
                              onCopy={() => dropdown.closeDropdown()}
                            >
                              <a>
                                <FormattedMessage {...messages.copyVirtualShareLinkLabel} />
                              </a>
                            </CopyToClipboard>
                          </li>
                        )}
                        <li>
                          <CopyToClipboard
                            text={constructChallengeLink(challenge.id)}
                            onCopy={() => dropdown.closeDropdown()}
                          >
                            <a>
                              <FormattedMessage {...messages.copyShareLinkLabel} />
                            </a>
                          </CopyToClipboard>
                        </li>

                        <li className="mr-mt-n1px">
                          <OwnerContactLink {...this.props} />
                        </li>

                        <li className="mr-links-green-lighter">
                          <JoinChallengeDiscussionLink {...this.props} />
                        </li>
                      </ul>

                      {isManageable && !this.props.inspectTask && (
                        <Fragment>
                          <hr className="mr-rule-dropdown" />
                          <ul className="mr-list-dropdown">
                            <li>
                              <button
                                className="mr-transition mr-text-green-lighter hover:mr-text-current"
                                onClick={() => this.props.history.push(taskInspectRoute)}
                              >
                                <FormattedMessage {...messages.inspectLabel} />
                              </button>
                            </li>
                          </ul>
                        </Fragment>
                      )}
                    </Fragment>
                  )}
                />
              </div>
            }
            completeTask={this.completeTask}
            completingTask={this.props.completingTask}
            setCompletionResponse={this.setCompletionResponse}
            setNeedsResponses={this.setNeedsResponses}
            completionResponses={completionResponses}
            needsResponses={this.state.needsResponses}
            templateRevision={isCompletionStatus(this.props.task.status)}
            enhancedMapWidget={
              <EnhancedTaskMapWidget {...this.props} onLayoutChange={() => null} />
            }
          />
        </MediaQuery>
        <MediaQuery query="(max-width: 1023px)">
          <MapPane>
            <TaskMap
              isMobile
              task={this.props.task}
              challenge={this.props.task.parent}
              {...this.props}
            />
          </MapPane>
          <MobileTabBar {...this.props} />
        </MediaQuery>
        {this.state.showLockFailureDialog && this.props.lockConflict && (
          <BasicDialog
            title={<FormattedMessage {...messages.lockConflictTitle} />}
            prompt={
              <FormattedMessage
                {...(this.props.lockConflict.parentName
                  ? messages.lockConflictDescriptionWithParent
                  : messages.lockConflictDescription)}
                values={{
                  taskId: this.props.lockConflict.lockedTaskId,
                  parentName: this.props.lockConflict.parentName,
                }}
              />
            }
            icon="unlocked-icon"
            onClose={() => this.clearLockFailure()}
            controls={
              <Fragment>
                <button
                  className="mr-button mr-button--white mr-mr-4"
                  onClick={() => this.clearLockFailure()}
                >
                  <FormattedMessage {...messages.previewTaskLabel} />
                </button>
                {this.props.releasingConflict || this.props.tryingLock ? (
                  <BusySpinner inline />
                ) : (
                  <button
                    className="mr-button mr-button--green-light"
                    onClick={() =>
                      this.props
                        .releaseConflictingLockAndRetry(this.props.task)
                        .then((success) => this.setState({ showLockFailureDialog: !success }))
                    }
                  >
                    <FormattedMessage {...messages.releaseLockAndContinueLabel} />
                  </button>
                )}
              </Fragment>
            }
          />
        )}
        {this.state.showLockFailureDialog && !this.props.lockConflict && (
          <BasicDialog
            title={<FormattedMessage {...messages.lockFailedTitle} />}
            prompt={
              <Fragment>
                <span>
                  {this.props.lockFailureDetails?.message ??
                    this.props.intl.formatMessage(messages.genericLockFailure)}
                </span>
                <FormattedMessage {...messages.previewAvailable} />
              </Fragment>
            }
            icon="unlocked-icon"
            onClose={() => this.clearLockFailure()}
            controls={
              <Fragment>
                <button
                  className="mr-button mr-button--green-light mr-mr-4"
                  onClick={() => this.clearLockFailure()}
                >
                  <FormattedMessage {...messages.previewTaskLabel} />
                </button>
                {this.props.tryingLock ? (
                  <div className="mr-mr-4">
                    <BusySpinner inline />
                  </div>
                ) : (
                  <button
                    className="mr-button mr-button--green-light mr-mr-4"
                    onClick={() => this.tryLockingTask()}
                  >
                    <FormattedMessage {...messages.retryLockLabel} />
                  </button>
                )}
                <button
                  className="mr-button mr-button--white"
                  onClick={() => {
                    this.props.history.push(
                      `/browse/challenges/${this.props.task?.parent?.id ?? this.props.task.parent}`,
                    );
                  }}
                >
                  <FormattedMessage {...messages.browseChallengeLabel} />
                </button>
                {!this.state.unlockRequested ? (
                  <button
                    className={"mr-button mr-button--green-light mr-ml-4"}
                    disabled={this.state.unlockRequested}
                    onClick={() => {
                      this.setState({ unlockRequested: true });
                      this.props.requestUnlock(this.props.task.id);
                    }}
                  >
                    <FormattedMessage {...messages.requestUnlock} />
                  </button>
                ) : (
                  <div className="mr-ml-4">Request Sent!</div>
                )}

                <div />
              </Fragment>
            }
          />
        )}
        {this.state.showLockOptionsDialog && (
          <BasicDialog
            title={<FormattedMessage {...messages.lockOptionsTitle} />}
            prompt={<FormattedMessage {...messages.lockOptionsPrompt} />}
            icon="locked-icon"
            onClose={() => this.closeLockOptionsDialog()}
            controls={
              <Fragment>
                <button
                  className="mr-button mr-button--white"
                  onClick={() => this.closeLockOptionsDialog()}
                >
                  <FormattedMessage {...messages.cancelLabel} />
                </button>
                {this.state.extendingLock ? (
                  <div className="mr-ml-4">
                    <BusySpinner inline />
                  </div>
                ) : (
                  <button
                    className="mr-button mr-button--green-light mr-ml-4"
                    onClick={() => this.extendTaskLock()}
                  >
                    <FormattedMessage {...messages.extendLockLabel} />
                  </button>
                )}
                <button
                  className="mr-button mr-button--green-light mr-ml-4"
                  onClick={() => {
                    this.props.history.push(
                      Number.isFinite(this.props.virtualChallengeId)
                        ? `/browse/virtual/${this.props.virtualChallengeId}`
                        : `/browse/challenges/${
                            this.props.task?.parent?.id ?? this.props.task.parent
                          }`,
                    );
                  }}
                >
                  <FormattedMessage {...messages.taskUnlockLabel} />
                </button>
              </Fragment>
            }
          />
        )}
      </div>
    );
  }
}

TaskPane.propTypes = {
  /** The task to be worked upon. */
  task: PropTypes.object,
};

export default WithChallengePreferences(
  WithWidgetWorkspaces(
    WithLockedTask(WithCooperativeWork(WithTaskBundle(injectIntl(TaskPane)))),
    WidgetDataTarget.task,
    WIDGET_WORKSPACE_NAME,
    defaultWorkspaceSetupClassic,
    defaultWorkspaceSetupLeftPanel,
  ),
);
