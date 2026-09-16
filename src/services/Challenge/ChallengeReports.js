import Endpoint from "../Server/Endpoint";
import { defaultRoutes as api } from "../Server/Server";

/**
 * Reports filed against a challenge's design -- "this challenge is poorly
 * designed and is causing incorrect edits" -- as opposed to a bug or a feature
 * request.
 *
 * These used to be filed as issues in a public GitHub repository, which needed
 * a GitHub write token shipped to the browser. They live in the MapRoulette
 * database now: the backend records the report, posts the accompanying
 * challenge comment itself, and lets a super admin triage the result in-app.
 */

/** Statuses a report can be in, matching the backend's constants. */
export const CHALLENGE_REPORT_STATUS_OPEN = 0;
export const CHALLENGE_REPORT_STATUS_ACTIONED = 1;
export const CHALLENGE_REPORT_STATUS_DISMISSED = 2;

/** Bounds the backend enforces on the report text; mirrored here for the form. */
export const CHALLENGE_REPORT_MIN_LENGTH = 100;
export const CHALLENGE_REPORT_MAX_LENGTH = 1000;

export const isOpenReport = (report) => report?.status === CHALLENGE_REPORT_STATUS_OPEN;

/**
 * Files a report against a challenge. The reporter is taken from the session
 * server-side, and the backend posts the challenge comment that tells the
 * challenge owner a report was raised, so there is nothing to assemble here.
 *
 * @param {number} challengeId - the challenge being reported
 * @param {string} comment - the reporter's explanation of the problem
 * @param {string} [email] - an optional contact address for follow-up
 *
 * @returns {Promise} resolves to the new report, rejects with the server error
 */
export const reportChallenge = function (challengeId, comment, email) {
  return new Endpoint(api.challenge.report, {
    variables: { id: challengeId },
    json: email ? { comment, email } : { comment },
  }).execute();
};

/**
 * Fetches every report filed against a challenge, newest first, resolved ones
 * included. Readable by anyone: filing a report also posts a public challenge
 * comment naming the reporter and quoting what they wrote. The email a reporter
 * volunteered, and the admin side of the triage record, are stripped by the
 * server.
 *
 * @param {number} challengeId - the challenge in question
 *
 * @returns {Promise} resolves to an array of reports
 */
export const fetchChallengeReports = function (challengeId) {
  return new Endpoint(api.challenge.reports, {
    variables: { id: challengeId },
  })
    .execute()
    .then((reports) => reports ?? []);
};

/**
 * Fetches the super admin triage listing.
 *
 * @param {object} [options] - status, challengeId, activeOnly, limit and page
 *
 * @returns {Promise} resolves to an array of reports, each carrying fullCount
 */
export const fetchChallengeReportListing = function ({
  status,
  challengeId,
  activeOnly = false,
  limit = 50,
  page = 0,
} = {}) {
  const params = { activeOnly, limit, page };
  if (status) {
    params.status = status;
  }
  if (challengeId) {
    params.challengeId = challengeId;
  }

  return new Endpoint(api.challenge.reportListing, { params })
    .execute()
    .then((reports) => reports ?? []);
};

/**
 * Records a super admin's decision on a report. Reports are resolved rather
 * than deleted, so the record of what was raised and what was done about it
 * survives.
 *
 * @param {number} reportId - the report being resolved
 * @param {string} status - "actioned" or "dismissed"
 * @param {string} [reviewComment] - an optional note about what was done
 *
 * @returns {Promise} resolves to the updated report
 */
export const updateChallengeReportStatus = function (reportId, status, reviewComment) {
  return new Endpoint(api.challenge.reportStatus, {
    variables: { id: reportId },
    json: reviewComment ? { status, reviewComment } : { status },
  }).execute();
};
