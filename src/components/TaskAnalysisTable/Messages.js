import { defineMessages } from "react-intl";

/**
 * Internationalized messages for use with TaskAnalysisTable
 */
export default defineMessages({
  controlsLabel: {
    id: "Admin.TaskAnalysisTable.columnHeaders.actions",
    defaultMessage: "Actions",
  },

  invertLabel: {
    id: "TaskConfirmationModal.invert.label",
    defaultMessage: "invert",
  },

  invertedLabel: {
    id: "TaskConfirmationModal.inverted.label",
    defaultMessage: "inverted",
  },

  idLabel: {
    id: "Review.Task.fields.id.label",
    defaultMessage: "Internal Id",
  },

  featureIdLabel: {
    id: "Review.Task.fields.featureId.label",
    defaultMessage: "Feature Id",
  },

  unbundle: {
    id: "Task.fields.unbundle.label",
    defaultMessage: "Unbundle",
  },

  bundle: {
    id: "Activity.item.bundle",
    defaultMessage: "Bundle",
  },

  statusLabel: {
    id: "Admin.EditTask.form.status.label",
    defaultMessage: "Status",
  },

  priorityLabel: {
    id: "Admin.EditTask.form.priority.label",
    defaultMessage: "Priority",
  },

  mappedOnLabel: {
    id: "Review.fields.mappedOn.label",
    defaultMessage: "Mapped On",
  },

  reviewStatusLabel: {
    id: "ChallengeProgress.reviewStatus.label",
    defaultMessage: "Review Status",
  },

  metaReviewStatusLabel: {
    id: "Review.fields.metaReviewStatus.label",
    defaultMessage: "Meta-Review Status",
  },

  completedByLabel: {
    id: "Task.fields.completedBy.label",
    defaultMessage: "Completed By",
  },

  completedDurationLabel: {
    id: "Admin.fields.completedDuration.label",
    defaultMessage: "Completion Time",
  },

  reviewRequestedByLabel: {
    id: "Review.fields.requestedBy.label",
    defaultMessage: "Mapper",
  },

  reviewedByLabel: {
    id: "Review.Dashboard.asReviewer.label",
    defaultMessage: "Reviewer",
  },

  metaReviewedByLabel: {
    id: "Review.Dashboard.asMetaReviewer.label",
    defaultMessage: "Meta-Reviewer",
  },

  reviewedAtLabel: {
    id: "Admin.fields.reviewedAt.label",
    defaultMessage: "Reviewed On",
  },

  metaReviewedAtLabel: {
    id: "Admin.fields.metaReviewedAt.label",
    defaultMessage: "Meta-Reviewed On",
  },

  reviewDurationLabel: {
    id: "Admin.fields.reviewDuration.label",
    defaultMessage: "Review Time",
  },

  additionalReviewersLabel: {
    id: "Admin.fields.additionalReviewers.label",
    defaultMessage: "Additional Reviewers",
  },

  commentsLabel: {
    id: "Admin.TaskAnalysisTable.columnHeaders.comments",
    defaultMessage: "Comments",
  },

  tagsLabel: {
    id: "Admin.TaskAnalysisTable.columnHeaders.tags",
    defaultMessage: "Tags",
  },

  inspectTaskLabel: {
    id: "Admin.TaskAnalysisTable.controls.inspectTask.label",
    defaultMessage: "Inspect",
  },

  reviewTaskLabel: {
    id: "Admin.TaskAnalysisTable.controls.reviewTask.label",
    defaultMessage: "Review",
  },

  editTaskLabel: {
    id: "Admin.EditChallenge.edit.header",
    defaultMessage: "Edit",
  },

  startTaskLabel: {
    id: "Admin.TaskAnalysisTable.controls.startTask.label",
    defaultMessage: "Start",
  },

  bulkSelectionTooltip: {
    id: "Admin.manageTasks.controls.bulkSelection.tooltip",
    defaultMessage: "Select tasks",
  },

  taskCountShownStatus: {
    id: "Admin.TaskAnalysisTableHeader.taskCountStatus",
    defaultMessage: "Shown: {countShown} Tasks",
  },

  taskCountSelectedStatus: {
    id: "Admin.TaskAnalysisTableHeader.taskCountSelectedStatus",
    defaultMessage: "Selected: {selectedCount} Tasks",
  },

  taskPercentShownStatus: {
    id: "Admin.TaskAnalysisTableHeader.taskPercentStatus",
    defaultMessage: "Shown: {percentShown}% ({countShown}) of {countTotal} Tasks",
  },

  changeStatusToLabel: {
    id: "Admin.manageTasks.controls.changeStatusTo.label",
    defaultMessage: "Change status to ",
  },

  chooseStatusLabel: {
    id: "Admin.manageTasks.controls.chooseStatus.label",
    defaultMessage: "Choose ... ",
  },

  changeReviewStatusLabel: {
    id: "Admin.manageTasks.controls.changeReviewStatus.label",
    defaultMessage: "Remove from review queue ",
  },

  removeMetaReviewStatusLabel: {
    id: "Admin.manageTasks.controls.removeMetaReviewStatus.label",
    defaultMessage: "Remove from meta-review ",
  },

  showReviewColumnsLabel: {
    id: "Admin.manageTasks.controls.showReviewColumns.label",
    defaultMessage: "Show Review Columns",
  },

  hideReviewColumnsLabel: {
    id: "Admin.manageTasks.controls.hideReviewColumns.label",
    defaultMessage: "Hide Review Columns",
  },

  configureColumnsLabel: {
    id: "Admin.manageTasks.controls.configureColumns.label",
    defaultMessage: "Configure Columns",
  },

  exportTitle: {
    id: "Admin.manageProjectChallenges.controls.export.title",
    defaultMessage: "Export",
  },

  exportCSVLabel: {
    id: "Admin.Project.controls.export.label",
    defaultMessage: "Export CSV",
  },

  exportGeoJSONLabel: {
    id: "Admin.manageTasks.controls.exportGeoJSON.label",
    defaultMessage: "Export GeoJSON",
  },

  exportMapperReviewCSVLabel: {
    id: "Admin.Project.controls.exportReviewCSV.label",
    defaultMessage: "Export Mapper Review CSV",
  },

  exportReviewerMetaCSVLabel: {
    id: "Admin.manageTasks.controls.exportReviewerMetaCSV.label",
    defaultMessage: "Export Meta-Review Coverage CSV",
  },

  exportTaskReviewHistoryLabel: {
    id: "Admin.manageTasks.controls.exportTaskReviewHistory.label",
    defaultMessage: "Export Task Review History CSV",
  },

  timezoneLabel: {
    id: "Admin.manageProjectChallenges.controls.timezone.label",
    defaultMessage: "Timezone",
  },

  shownLabel: {
    id: "Admin.TaskAnalysisTableHeader.controls.chooseShown.label",
    defaultMessage: "Shown",
  },

  multipleTasksTooltip: {
    id: "Admin.TaskAnalysisTable.multipleTasks.tooltip",
    defaultMessage: "Multiple bundled tasks",
  },

  bundleMemberTooltip: {
    id: "Admin.TaskAnalysisTable.bundleMember.tooltip",
    defaultMessage: "Member of a task bundle",
  },

  confirmActionWarning: {
    id: "Admin.TaskAnalysisTable.confirmActionWarning",
    defaultMessage:
      "This process can take awhile, depending on the challenge size, and cannot be undone.",
  },

  lockTaskError: {
    id: "Widgets.TaskBundleWidget.lockTaskError",
    defaultMessage: "Failed to lock task {taskId}. Please try again.",
  },

  failedLockError: {
    id: "Widgets.TaskBundleWidget.failedLockError",
    defaultMessage: "Failed to lock one or more tasks. Please try again.",
  },

  searchMapperPlaceholder: {
    id: "TaskAnalysisTable.columns.searchMapper.placeholder",
    defaultMessage: "Search mapper...",
  },

  searchReviewerPlaceholder: {
    id: "TaskAnalysisTable.columns.searchReviewer.placeholder",
    defaultMessage: "Search reviewer...",
  },

  searchMetaReviewerPlaceholder: {
    id: "TaskAnalysisTable.columns.searchMetaReviewer.placeholder",
    defaultMessage: "Search meta reviewer...",
  },

  searchFeatureIdPlaceholder: {
    id: "TaskAnalysisTable.columns.searchFeatureId.placeholder",
    defaultMessage: "Search feature ID...",
  },

  searchIdPlaceholder: {
    id: "TaskAnalysisTable.columns.searchId.placeholder",
    defaultMessage: "Search ID...",
  },

  clearFilterLabel: {
    id: "TaskAnalysisTable.controls.clearFilter.label",
    defaultMessage: "Clear filter",
  },
});
