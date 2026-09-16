import { useQuery } from "@apollo/client";
import _filter from "lodash/filter";
import _find from "lodash/find";
import PropTypes from "prop-types";
import { Fragment, useEffect } from "react";
import { FormattedMessage } from "react-intl";
import AsTeamMember from "../../../interactions/TeamMember/AsTeamMember";
import { subscribeToTeamUpdates, unsubscribeFromTeamUpdates } from "../../../services/Team/Team";
import BusySpinner from "../../BusySpinner/BusySpinner";
import AddTeamMember from "../AddTeamMember/AddTeamMember";
import MemberItem from "../MemberItem/MemberItem";
import { TEAM_USERS } from "../TeamQueries";
import messages from "./Messages";

export const ViewTeam = (props) => {
  const { loading, error, data, refetch } = useQuery(TEAM_USERS, {
    variables: { teamId: props.team.id },
    partialRefetch: true,
  });

  useEffect(() => {
    subscribeToTeamUpdates((message) => {
      if (message.data.userId === props.user.id || message.data.teamId === props.team.id) {
        refetch();
      }
    }, "ViewTeam");

    return () => unsubscribeFromTeamUpdates("ViewTeam");
  });

  if (error) {
    throw error;
  }

  if (loading) {
    return <BusySpinner />;
  }

  const userTeamMember = AsTeamMember(
    _find(data.teamUsers, (teamUser) => AsTeamMember(teamUser).isUser(props.user)),
  );

  const activeMembers = _filter(data.teamUsers, (teamUser) => AsTeamMember(teamUser).isActive());

  const invitedMembers = _filter(data.teamUsers, (teamUser) => AsTeamMember(teamUser).isInvited());

  return (
    <div>
      <div className="mr-flex mr-justify-between">
        <div className="mr-text-lg mr-text-mango">{props.team.name}</div>
        {props.teamControls}
      </div>
      <div className="mr-mt-2 mr-mb-4 mr-text-sm mr-text-white">{props.team.description}</div>

      <h5 className="mr-mt-6 mr-mb-2 mr-text-xs mr-uppercase mr-text-pink">
        <FormattedMessage {...messages.activeMembersHeader} />
      </h5>
      <ul className="mr-links-green-lighter">
        {activeMembers.map((member) => (
          <MemberItem
            key={member.id}
            {...props}
            teamUser={member}
            teamUsers={data.teamUsers}
            userTeamMember={userTeamMember}
          />
        ))}
      </ul>

      {invitedMembers.length > 0 && (
        <Fragment>
          <h5 className="mr-mt-6 mr-mb-2 mr-text-xs mr-uppercase mr-text-pink">
            <FormattedMessage {...messages.invitedMembersHeader} />
          </h5>
          <ul className="mr-links-green-lighter">
            {invitedMembers.map((member) => (
              <MemberItem
                key={member.id}
                {...props}
                teamUser={member}
                teamUsers={data.teamUsers}
                userTeamMember={userTeamMember}
              />
            ))}
          </ul>
        </Fragment>
      )}

      {userTeamMember.isTeamAdmin() && (
        <Fragment>
          <h5 className="mr-mt-6 mr-mb-2 mr-text-base mr-text-yellow">
            <FormattedMessage {...messages.addMembersHeader} />
          </h5>
          <AddTeamMember {...props} userTeamMember={userTeamMember} />
        </Fragment>
      )}
    </div>
  );
};

ViewTeam.propTypes = {
  team: PropTypes.object.isRequired,
};

export default ViewTeam;
