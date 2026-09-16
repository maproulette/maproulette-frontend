import { useMutation } from "@apollo/client";
import PropTypes from "prop-types";
import { useState } from "react";
import { injectIntl } from "react-intl";
import AppErrors from "../../../services/Error/AppErrors";
import { TeamRole, messagesByTeamRole } from "../../../services/Team/Role";
import AutosuggestTextBox from "../../AutosuggestTextBox/AutosuggestTextBox";
import BusySpinner from "../../BusySpinner/BusySpinner";
import WithOSMUserSearch from "../../HOCs/WithOSMUserSearch/WithOSMUserSearch";
import RolePicker from "../../RolePicker/RolePicker";
import { INVITE_USER } from "../TeamQueries";
import messages from "./Messages";

const ChooseOSMUser = WithOSMUserSearch(AutosuggestTextBox);

/**
 * Control for inviting a user to join a team
 */
const AddTeamMember = (props) => {
  const [username, setUsername] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [inviteTeamUser, { loading: isSaving }] = useMutation(INVITE_USER);

  const inviteSelectedUser = (role) => {
    inviteTeamUser({
      variables: { teamId: props.team.id, userId: selectedUser.id, role: parseInt(role) },
      refetchQueries: ["TeamUsers"],
    }).catch((error) => {
      props.addErrorWithDetails(AppErrors.team.failure, error.message);
    });
    setSelectedUser(null);
    setUsername("");
  };

  if (isSaving) {
    return <BusySpinner />;
  }

  return (
    <div className="mr-flex mr-justify-between">
      <div className="mr-mr-4 mr-flex-grow">
        <ChooseOSMUser
          inputValue={username}
          inputClassName="mr-py-2 mr-px-4 mr-border-none mr-placeholder-white-50 mr-text-white mr-rounded mr-bg-black-15 mr-shadow-inner"
          selectedItem={selectedUser}
          onInputValueChange={(username) => setUsername(username)}
          onChange={(osmUser) => setSelectedUser(osmUser)}
          placeholder={props.intl.formatMessage(messages.osmUsername)}
        />
      </div>
      {selectedUser && (
        <RolePicker
          {...props}
          roles={[TeamRole.member, TeamRole.manager, TeamRole.admin, TeamRole.owner]}
          messagesByRole={messagesByTeamRole}
          unavailableRoles={props.userTeamMember?.isTeamOwner() ? [] : [TeamRole.owner]}
          pickRole={inviteSelectedUser}
        />
      )}
    </div>
  );
};

AddTeamMember.propTypes = {
  team: PropTypes.object.isRequired,
};

export default injectIntl(AddTeamMember);
