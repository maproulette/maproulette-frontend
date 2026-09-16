import { defineMessages } from "react-intl";

/**
 * Internationalized messages for use with ChallengeResultItem.
 */
export default defineMessages({
  pausedNotice: {
    id: "ChallengeDetails.pausedNotice.label",
    defaultMessage:
      "This challenge is currently paused. Tasks cannot be completed or reviewed until it resumes.",
  },

  goBack: {
    id: "ChallengeDetails.controls.goBack.label",
    defaultMessage: "Go Back",
  },

  start: {
    id: "Admin.TaskAnalysisTable.controls.startTask.label",
    defaultMessage: "Start",
  },

  favorite: {
    id: "ChallengeDetails.controls.favorite.label",
    defaultMessage: "Favorite",
  },

  saveToFavorites: {
    id: "ChallengeDetails.controls.favorite.tooltip",
    defaultMessage: "Save to favorites",
  },

  unfavorite: {
    id: "ChallengeDetails.controls.unfavorite.label",
    defaultMessage: "Unfavorite",
  },

  removeFromFavorites: {
    id: "ChallengeDetails.controls.unfavorite.tooltip",
    defaultMessage: "Remove from favorites",
  },

  manageLabel: {
    id: "Challenge.management.controls.manage.label",
    defaultMessage: "Manage",
  },

  featured: {
    id: "Admin.EditChallenge.form.featured.label",
    defaultMessage: "Featured",
  },

  difficulty: {
    id: "Challenge.fields.difficulty.label",
    defaultMessage: "Difficulty",
  },

  lastTaskRefreshLabel: {
    id: "ChallengeDetails.fields.lastChallengeDetails.TaskRefresh.label",
    defaultMessage: "Task Data Sourced",
  },

  ownerLabel: {
    id: "Admin.ProjectManagers.projectOwner",
    defaultMessage: "Owner",
  },

  dataOriginDateLabel: {
    id: "ChallengeDetails.fields.lastChallengeDetails.DataOriginDate.label",
    defaultMessage: "Tasks built on {refreshDate} from data sourced on {sourceDate}.",
  },

  viewLeaderboard: {
    id: "Challenge.fields.viewLeaderboard.label",
    defaultMessage: "View Leaderboard",
  },

  viewReviews: {
    id: "Admin.TaskAnalysisTable.controls.reviewTask.label",
    defaultMessage: "Review",
  },

  viewComments: {
    id: "ChallengeDetails.fields.viewComments.label",
    defaultMessage: "Get In Touch",
  },

  viewOverview: {
    id: "ChallengeDetails.fields.viewOverview.label",
    defaultMessage: "Overview",
  },

  overpassQL: {
    id: "ChallengeDetails.fields.overpassQL.label",
    defaultMessage: "Overpass Query",
  },

  write: {
    id: "ChallengeDetails.controls.write.label",
    defaultMessage: "Write",
  },

  preview: {
    id: "ChallengeDetails.controls.preview.label",
    defaultMessage: "Preview",
  },

  review: {
    id: "ChallengeDetails.controls.review.label",
    defaultMessage: "I have attempted to contact the Challenge creator",
  },

  modalSubtitle: {
    id: "ChallengeDetails.controls.modal.subtitle",
    defaultMessage:
      "You are about to report a Challenge. Your report goes to the MapRoulette administrators for review, and a comment naming you is posted on the Challenge so its creator knows it was raised. Reporting a Challenge does not disable it immediately. Please explain in detail what your issue is with this challenge, if possible linking to specific OSM changesets.",
  },

  submitReport: {
    id: "ChallengeDetails.controls.submit.report.label",
    defaultMessage: "Report Challenge",
  },

  textInputError: {
    id: "ChallengeDetails.controls.text.input.error",
    defaultMessage: "Text Input should have minimum 100 characters",
  },

  checkboxError: {
    id: "ChallengeDetails.controls.checkbox.error",
    defaultMessage: "Please ensure that checkbox is checked before continue",
  },

  reportedText: {
    id: "ChallengeDetails.controls.reported_text",
    defaultMessage: "This challenge has been reported",
  },

  reportChallengeTooltip: {
    id: "ChallengeDetails.controls.report.tooltip",
    defaultMessage: "Report challenge",
  },

  viewReportsTooltip: {
    id: "ChallengeDetails.reports.view.tooltip",
    defaultMessage: "View the reports on this challenge",
  },

  reportsModalTitle: {
    id: "ChallengeDetails.reports.title",
    defaultMessage: "Reports on This Challenge",
  },

  reportsModalSubtitle: {
    id: "ChallengeDetails.reports.subtitle",
    defaultMessage:
      "Reports filed against this challenge and where each one stands. The MapRoulette administrators review every report.",
  },

  reportsModalEmpty: {
    id: "ChallengeDetails.reports.empty",
    defaultMessage: "No one has reported this challenge.",
  },

  reportedByOn: {
    id: "ChallengeDetails.reports.reportedByOn",
    defaultMessage: "Reported by {user} on {date}",
  },

  reportedByYou: {
    id: "ChallengeDetails.reports.reportedByYou",
    defaultMessage: "you",
  },

  unknownUser: {
    id: "ChallengeDetails.reports.unknownUser",
    defaultMessage: "Unknown",
  },

  reportAwaitingReview: {
    id: "ChallengeDetails.reports.awaitingReview",
    defaultMessage: "Awaiting review by the MapRoulette administrators.",
  },

  reportResolvedOn: {
    id: "ChallengeDetails.reports.resolvedOn",
    defaultMessage: "Marked {status} on {date}",
  },

  reportResolved: {
    id: "ChallengeDetails.reports.resolved",
    defaultMessage: "Marked {status}",
  },

  reportSubmitError: {
    id: "ChallengeDetails.reports.submitError",
    defaultMessage: "Failed to submit report. Please try again.",
  },

  email: {
    id: "ChallengeDetails.controls.email",
    defaultMessage: "Email",
  },

  cloneChallenge: {
    id: "Admin.Challenge.controls.clone.label",
    defaultMessage: "Clone Challenge",
  },

  showMore: {
    id: "ChallengeDetails.controls.showMore.label",
    defaultMessage: "show more",
  },

  showLess: {
    id: "ChallengeDetails.controls.showLess.label",
    defaultMessage: "show less",
  },

  emailAddressLabel: {
    id: "ChallengeDetails.form.emailAddress.label",
    defaultMessage: "Email address",
  },

  enterEmailPlaceholder: {
    id: "ChallengeDetails.form.enterEmail.placeholder",
    defaultMessage: "Enter your email",
  },

  enterTextPlaceholder: {
    id: "ChallengeDetails.form.enterText.placeholder",
    defaultMessage: "Enter text here",
  },
});
