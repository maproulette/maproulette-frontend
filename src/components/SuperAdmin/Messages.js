import { defineMessages } from "react-intl";
/**
 * Internationalized messages for use with SuperAdmin
 */
export default defineMessages({
  header: {
    id: "Metrics.header",
    defaultMessage: "Metrics",
  },
  discoverable: {
    id: "Admin.EditChallenge.form.visible.label",
    defaultMessage: "Discoverable",
  },
  archived: {
    id: "Dashboard.ChallengeFilter.archived.label",
    defaultMessage: "Archived",
  },
  virtual: {
    id: "Admin.EditProject.form.isVirtual.label",
    defaultMessage: "Virtual",
  },
  hideUndiscoverable: {
    id: "Metrics.hideUndiscoverable",
    defaultMessage: "Hide Undiscoverable",
  },
  hideArchived: {
    id: "Metrics.hideArchived",
    defaultMessage: "Hide Archived",
  },
  download: {
    id: "Metrics.download",
    defaultMessage: "download",
  },
  clear: {
    id: "Metrics.clear",
    defaultMessage: "clear",
  },
  reportsLabel: {
    id: "Metrics.reports.label",
    defaultMessage: "Reports",
  },
  reportsTitle: {
    id: "Metrics.reports.title",
    defaultMessage: "Challenge reports",
  },
  reportsSubtitle: {
    id: "Metrics.reports.subtitle",
    defaultMessage:
      "Reports that a challenge is poorly designed and is causing incorrect edits. Mark one actioned once you have dealt with it -- by archiving the challenge, say -- or dismiss it.",
  },
  reportsActiveOnly: {
    id: "Metrics.reports.activeOnly",
    defaultMessage: "Only challenges that are still active",
  },
  reportsNone: {
    id: "Metrics.reports.none",
    defaultMessage: "No reports match these filters.",
  },
  reportsPreviousPage: {
    id: "Metrics.reports.previousPage",
    defaultMessage: "Previous",
  },
  reportsNextPage: {
    id: "Metrics.reports.nextPage",
    defaultMessage: "Next",
  },
  reportMeta: {
    id: "Metrics.reports.meta",
    defaultMessage: "{project} · reported by {user} on {date}",
  },
  reportResolvedMeta: {
    id: "Metrics.reports.resolvedMeta",
    defaultMessage: "{status} by {user} on {date}",
  },
  reportArchivedBadge: {
    id: "Metrics.reports.archivedBadge",
    defaultMessage: "Archived",
  },
  reportNotePlaceholder: {
    id: "Metrics.reports.notePlaceholder",
    defaultMessage: "Note (optional)",
  },
  reportMarkActioned: {
    id: "Metrics.reports.markActioned",
    defaultMessage: "Mark actioned",
  },
  reportDismiss: {
    id: "Metrics.reports.dismiss",
    defaultMessage: "Dismiss",
  },
  challengeLabel: {
    id: "Admin.ProjectCard.tabs.challenges.label",
    defaultMessage: "Challenges",
  },
  projectLabel: {
    id: "ChallengeFilterSubnav.query.searchType.project",
    defaultMessage: "Projects",
  },
  userLabel: {
    id: "Metrics.users",
    defaultMessage: "Users",
  },
  sortByLabel: {
    id: "Metrics.sortBy",
    defaultMessage: "Sort By",
  },
});
