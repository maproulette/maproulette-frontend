import classNames from "classnames";
import { useCallback, useEffect, useState } from "react";
import { FormattedDate, FormattedMessage, FormattedTime } from "react-intl";
import { Link } from "react-router-dom";
import {
  fetchChallengeReportListing,
  isOpenReport,
  updateChallengeReportStatus,
} from "../../services/Challenge/ChallengeReports";
import BusySpinner from "../BusySpinner/BusySpinner";
import MarkdownContent from "../MarkdownContent/MarkdownContent";
import messages from "./Messages";

const STATUS_FILTERS = ["open", "actioned", "dismissed"];
const PAGE_SIZE = 25;

const statusColor = (statusName) => {
  switch (statusName) {
    case "open":
      return "mr-text-red-light";
    case "actioned":
      return "mr-text-green-light";
    default:
      return "mr-text-grey-light";
  }
};

/**
 * One report, with the controls an admin needs to close it out: a note
 * recording what was decided, and the two ways a report can be resolved.
 */
const ReportRow = ({ report, onResolved }) => {
  const [reviewComment, setReviewComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const decide = async (status) => {
    setBusy(true);
    setError(null);

    try {
      const updated = await updateChallengeReportStatus(
        report.id,
        status,
        reviewComment.trim() || undefined,
      );
      onResolved(updated);
    } catch (resolveError) {
      setError(resolveError.details?.message ?? resolveError.message);
      setBusy(false);
    }
  };

  return (
    <li className="mr-mb-4 mr-p-4 mr-border-2 mr-rounded mr-border-grey-lighter-10">
      <div className="mr-flex mr-justify-between mr-items-start">
        <div>
          <Link to={`/browse/challenges/${report.challengeId}`} className="mr-text-green-lighter">
            #{report.challengeId} {report.challengeName ? `- ${report.challengeName}` : null}
          </Link>
          <div className="mr-text-xs mr-text-white-50 mr-mt-1">
            <FormattedMessage
              {...messages.reportMeta}
              values={{
                project: report.projectName ?? report.projectId,
                user: report.reporterName ?? "",
                date: (
                  <>
                    <FormattedDate value={new Date(report.reportedAt)} />{" "}
                    <FormattedTime value={new Date(report.reportedAt)} />
                  </>
                ),
              }}
            />
          </div>
          {report.reporterEmail ? (
            <div className="mr-text-xs mr-text-white-50">{report.reporterEmail}</div>
          ) : null}
        </div>
        <div className="mr-flex mr-items-center">
          {report.challengeIsArchived ? (
            <span className="mr-text-xs mr-text-orange mr-mr-4 mr-uppercase">
              <FormattedMessage {...messages.reportArchivedBadge} />
            </span>
          ) : null}
          <span
            className={classNames(
              "mr-uppercase mr-font-medium mr-text-xs",
              statusColor(report.statusName),
            )}
          >
            {report.statusName}
          </span>
        </div>
      </div>

      <div className="mr-mt-2 mr-text-white">
        <MarkdownContent markdown={report.comment} />
      </div>

      {isOpenReport(report) ? (
        <div className="mr-flex mr-items-center mr-mt-4">
          <input
            className="form-control mr-mr-4 mr-w-64"
            type="text"
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            placeholder={messages.reportNotePlaceholder.defaultMessage}
          />
          <button
            className="mr-button mr-button--small mr-mr-4"
            onClick={() => decide("actioned")}
            disabled={busy}
          >
            <FormattedMessage {...messages.reportMarkActioned} />
          </button>
          <button
            className="mr-button mr-button--small mr-button--white"
            onClick={() => decide("dismissed")}
            disabled={busy}
          >
            <FormattedMessage {...messages.reportDismiss} />
          </button>
          {busy ? <BusySpinner /> : null}
        </div>
      ) : (
        <div className="mr-mt-2 mr-text-xs mr-text-white-50">
          <FormattedMessage
            {...messages.reportResolvedMeta}
            values={{
              status: report.statusName,
              user: report.reviewedByName ?? "",
              date: report.reviewedAt ? <FormattedDate value={new Date(report.reviewedAt)} /> : "",
            }}
          />
          {report.reviewComment ? ` — ${report.reviewComment}` : null}
        </div>
      )}

      {error ? <div className="mr-text-red mr-mt-2">{error}</div> : null}
    </li>
  );
};

/**
 * The super admin triage queue for challenge reports. Defaults to open reports
 * on challenges that are still active, which is the set an admin can actually
 * do something about.
 *
 * Reports used to live as issues in a public GitHub repository, where they were
 * triaged by hand; they are rows in the MapRoulette database now, so this is
 * where they get dealt with.
 */
const ChallengeReports = () => {
  const [status, setStatus] = useState("open");
  const [activeOnly, setActiveOnly] = useState(true);
  const [page, setPage] = useState(0);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setReports(await fetchChallengeReportListing({ status, activeOnly, limit: PAGE_SIZE, page }));
    } catch (fetchError) {
      setError(fetchError.details?.message ?? fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [status, activeOnly, page]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // A resolved report leaves whichever status filter is showing, so reload
  // rather than patching it in place and leaving a row that no longer matches.
  const onResolved = () => loadReports();

  const totalCount = reports[0]?.fullCount ?? 0;
  const hasNextPage = (page + 1) * PAGE_SIZE < totalCount;

  return (
    <div className="mr-p-4">
      <h2 className="mr-text-yellow mr-text-2xl mr-mb-2">
        <FormattedMessage {...messages.reportsTitle} />
      </h2>
      <p className="mr-text-white-50 mr-mb-4">
        <FormattedMessage {...messages.reportsSubtitle} />
      </p>

      <div className="mr-flex mr-items-center mr-mb-6">
        <div className="mr-flex mr-items-center mr-mr-8">
          {STATUS_FILTERS.map((option) => (
            <button
              key={option}
              className={classNames(
                "mr-button mr-button--small mr-mr-2",
                status === option ? "" : "mr-button--white",
              )}
              onClick={() => {
                setPage(0);
                setStatus(option);
              }}
            >
              {option}
            </button>
          ))}
        </div>
        <label className="mr-flex mr-items-center mr-text-white-50">
          <input
            type="checkbox"
            className="mr-mr-2"
            checked={activeOnly}
            onChange={(event) => {
              setPage(0);
              setActiveOnly(event.target.checked);
            }}
          />
          <FormattedMessage {...messages.reportsActiveOnly} />
        </label>
      </div>

      {loading ? (
        <BusySpinner />
      ) : error ? (
        <div className="mr-text-red">{error}</div>
      ) : reports.length === 0 ? (
        <div className="mr-text-white-50">
          <FormattedMessage {...messages.reportsNone} />
        </div>
      ) : (
        <>
          <ul>
            {reports.map((report) => (
              <ReportRow key={report.id} report={report} onResolved={onResolved} />
            ))}
          </ul>
          {(page > 0 || hasNextPage) && (
            <div className="mr-flex mr-items-center mr-mt-4">
              <button
                className="mr-button mr-button--small mr-mr-4"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
              >
                <FormattedMessage {...messages.reportsPreviousPage} />
              </button>
              <button
                className="mr-button mr-button--small"
                onClick={() => setPage(page + 1)}
                disabled={!hasNextPage}
              >
                <FormattedMessage {...messages.reportsNextPage} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChallengeReports;
