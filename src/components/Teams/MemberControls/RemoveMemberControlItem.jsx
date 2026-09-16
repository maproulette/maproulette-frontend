import { useMutation } from "@apollo/client";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import AppErrors from "../../../services/Error/AppErrors";
import BusySpinner from "../../BusySpinner/BusySpinner";
import ConfirmAction from "../../ConfirmAction/ConfirmAction";
import { REMOVE_USER } from "../TeamQueries";
import messages from "./Messages";

/**
 * Control item for removing a member from a team (either as an admin, or
 * leaving a team as the current user)
 */
const RemoveMemberControlItem = (props) => {
  const [removeTeamUser, { loading: isSaving }] = useMutation(REMOVE_USER);

  // Only the member itself or a team admin can remove members, and members can
  // only remove themselves if they are active on the team (if they are merely
  // invited, they need to decline the invitation instead)
  const isAdmin = props.userTeamMember && props.userTeamMember.isTeamAdmin();
  if (!isAdmin) {
    if (!props.teamMember.isUser(props.user) || !props.teamMember.isActive()) {
      return null;
    }
  }

  if (isSaving) {
    return <BusySpinner />;
  }

  // A team is never left without an owner, so its last one can neither leave
  // nor be removed.
  if (props.isLastOwner) {
    return (
      <li className={props.className}>
        <span
          className="mr-text-white-50"
          title={props.intl.formatMessage(messages.lastOwnerTooltip)}
        >
          {props.teamMember.isUser(props.user) ? (
            <FormattedMessage {...messages.leaveTeamLabel} />
          ) : (
            <FormattedMessage {...messages.removeMemberLabel} />
          )}
        </span>
      </li>
    );
  }

  return (
    <li className={props.className}>
      <ConfirmAction>
        <a
          onClick={() => {
            removeTeamUser({
              variables: {
                teamId: props.teamMember.team.id,
                userId: props.teamMember.userId,
              },
              refetchQueries: props.refetchQueries,
            }).catch((error) => {
              props.addErrorWithDetails(AppErrors.team.failure, error.message);
            });
          }}
        >
          {props.teamMember.isUser(props.user) ? (
            <FormattedMessage {...messages.leaveTeamLabel} />
          ) : (
            <FormattedMessage {...messages.removeMemberLabel} />
          )}
        </a>
      </ConfirmAction>
    </li>
  );
};

RemoveMemberControlItem.propTypes = {
  user: PropTypes.object.isRequired,
  userTeamMember: PropTypes.object,
  teamMember: PropTypes.object.isRequired,
  refetchQueries: PropTypes.array,
  /** True when this member is the only owner the team has */
  isLastOwner: PropTypes.bool,
};

RemoveMemberControlItem.defaultProps = {
  refetchQueries: [],
};

export default RemoveMemberControlItem;
