import { defineMessages } from "react-intl";

/**
 * Internationalized names for the roles a team member can hold.
 *
 * Kept apart from the team status messages: `Status.js` maps that file's
 * messages onto status values by position, so anything else living there would
 * be read as a status.
 */
export default defineMessages({
  owner: {
    id: "Team.Role.owner",
    defaultMessage: "Owner",
  },
  admin: {
    id: "Team.Role.admin",
    defaultMessage: "Admin",
  },
  manager: {
    id: "Team.Role.manager",
    defaultMessage: "Manager",
  },
  member: {
    id: "Team.Role.member",
    defaultMessage: "Member",
  },
});
