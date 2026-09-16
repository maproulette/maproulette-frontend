import PropTypes from "prop-types";
import { Role, messagesByRole } from "../../services/Grant/Role";
import messages from "./Messages";

/**
 * The generic grant roles, used when a caller doesn't say otherwise. Teams pass
 * their own set: the same numbers under team-facing names, plus the owner role
 * that only teams have.
 */
const DEFAULT_ROLES = [Role.read, Role.write, Role.admin];

const RolePicker = (props) => {
  const roles = props.roles ?? DEFAULT_ROLES;
  const roleMessages = props.messagesByRole ?? messagesByRole;
  // A role the picker may show but this user may not hand out -- granting team
  // ownership is an owner's call alone, and the server rejects it from anyone
  // else, so it is shown disabled rather than offered and then refused.
  const unavailableRoles = props.unavailableRoles ?? [];

  const roleOptions = roles.map((role) => (
    <option key={role} value={role} disabled={unavailableRoles.includes(role)}>
      {props.intl.formatMessage(roleMessages[role])}
    </option>
  ));

  return (
    <select
      value={props.role ?? ""}
      onChange={(e) => props.pickRole(e.target.value)}
      className="mr-flex-grow-0 mr-min-w-30 mr-select"
      disabled={props.disabled}
      title={props.title}
    >
      {[
        <option key="none" value="">
          {props.intl.formatMessage(messages.chooseRole)}
        </option>,
      ].concat(roleOptions)}
    </select>
  );
};

RolePicker.propTypes = {
  pickRole: PropTypes.func.isRequired,
  /** Role values to offer, most privileged last. Defaults to the grant roles */
  roles: PropTypes.array,
  /** Maps those role values to internationalized messages */
  messagesByRole: PropTypes.object,
  /** Roles shown but not selectable by this user */
  unavailableRoles: PropTypes.array,
};

export default RolePicker;
