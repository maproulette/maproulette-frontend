import classNames from "classnames";
import { FormattedDate, FormattedMessage, FormattedTime } from "react-intl";
import { isOpenReport } from "../../services/Challenge/ChallengeReports";
import External from "../External/External";
import MarkdownContent from "../MarkdownContent/MarkdownContent";
import Modal from "../Modal/Modal";
import messages from "./Messages";

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
 * The reports filed against a challenge, as anyone browsing it may see them.
 * The reporters are named -- filing a report also posts a challenge comment
 * saying so -- but the email a reporter volunteered and the notes admins leave
 * on a decision are stripped by the server and never arrive here.
 */
const ChallengeReportsModal = (props) => {
  const reports = props.reports ?? [];
  // A reporter may only have one report open at a time, so offer to file one
  // only when this reader has none of their own outstanding.
  const canFileReport =
    props.user &&
    !reports.some((report) => isOpenReport(report) && report.reporterId === props.user.id);

  return (
    <External>
      <Modal contentClassName="mr-pb-6" isActive allowOverflow onClose={props.onCancel}>
        <h2 className="mr-text-grey-light-more mr-text-4xl mr-mt-4">
          <FormattedMessage {...messages.reportsModalTitle} />
        </h2>
        <div className="mr-text-base mr-mt-2 mr-text-yellow">
          <FormattedMessage {...messages.reportsModalSubtitle} />
        </div>

        {reports.length === 0 ? (
          <div className="mr-mt-6 mr-text-white-50">
            <FormattedMessage {...messages.reportsModalEmpty} />
          </div>
        ) : (
          <ul className="mr-mt-6 mr-max-h-screen50 mr-overflow-y-auto">
            {reports.map((report) => (
              <li
                key={report.id}
                className="mr-mb-4 mr-p-4 mr-border-2 mr-rounded mr-border-grey-lighter-10"
              >
                <div className="mr-flex mr-justify-between mr-items-center mr-text-xs">
                  <span className="mr-text-white-50">
                    <FormattedMessage
                      {...messages.reportedByOn}
                      values={{
                        user:
                          props.user && report.reporterId === props.user.id ? (
                            <FormattedMessage {...messages.reportedByYou} />
                          ) : (
                            (report.reporterName ?? <FormattedMessage {...messages.unknownUser} />)
                          ),
                        date: (
                          <>
                            <FormattedDate value={new Date(report.reportedAt)} />{" "}
                            <FormattedTime value={new Date(report.reportedAt)} />
                          </>
                        ),
                      }}
                    />
                  </span>
                  <span
                    className={classNames(
                      "mr-uppercase mr-font-medium",
                      statusColor(report.statusName),
                    )}
                  >
                    {report.statusName}
                  </span>
                </div>

                <div className="mr-mt-2 mr-text-white">
                  <MarkdownContent markdown={report.comment} />
                </div>

                <div className="mr-mt-2 mr-text-xs mr-text-white-50">
                  {isOpenReport(report) ? (
                    <FormattedMessage {...messages.reportAwaitingReview} />
                  ) : report.reviewedAt ? (
                    <FormattedMessage
                      {...messages.reportResolvedOn}
                      values={{
                        status: report.statusName,
                        date: <FormattedDate value={new Date(report.reviewedAt)} />,
                      }}
                    />
                  ) : (
                    <FormattedMessage
                      {...messages.reportResolved}
                      values={{ status: report.statusName }}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {canFileReport && (
          <div className="mr-flex mr-items-center mr-mt-6">
            <button className="mr-button mr-button--white mr-px-8" onClick={props.onFileReport}>
              <FormattedMessage {...messages.submitReport} />
            </button>
          </div>
        )}
      </Modal>
    </External>
  );
};

export default ChallengeReportsModal;
