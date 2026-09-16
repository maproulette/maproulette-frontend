import _fromPairs from "lodash/fromPairs";
import _map from "lodash/map";
import messages from "./RoleMessages";

/**
 * The four roles a team member can hold, and what each one is allowed to do.
 *
 * These are the generic grant roles under team-facing names -- the same numbers
 * the server stores, so the ordering the rest of the permission system relies
 * on (lower number, more privilege) still holds:
 *
 *   - Owner   deletes the team, makes other owners, and everything an admin can
 *   - Admin   invites and removes people and sets their roles, and everything a
 *             manager can
 *   - Manager creates, edits and deletes the team's projects and challenges
 *   - Member  belongs to the team and sees it listed, and nothing more
 *
 * Owner is the newest of the four. Every existing team has one: the server's
 * migration promoted the oldest admin on each team, which is its creator
 * wherever they are still around.
 */
export const TEAM_ROLE_OWNER = 0;
export const TEAM_ROLE_ADMIN = 1;
export const TEAM_ROLE_MANAGER = 2;
export const TEAM_ROLE_MEMBER = 3;

export const TeamRole = Object.freeze({
  owner: TEAM_ROLE_OWNER,
  admin: TEAM_ROLE_ADMIN,
  manager: TEAM_ROLE_MANAGER,
  member: TEAM_ROLE_MEMBER,
});

/**
 * Returns an object mapping team role values to raw internationalized messages
 * suitable for use with FormattedMessage or formatMessage
 */
export const messagesByTeamRole = _fromPairs(
  _map(messages, (message, key) => [TeamRole[key], message]),
);

/** Returns object containing localized labels */
export const teamRoleLabels = (intl) =>
  _fromPairs(_map(messages, (message, key) => [key, intl.formatMessage(message)]));

/** Whether the role may create, edit and delete the team's content */
export const managesContent = (role) => role !== null && role <= TEAM_ROLE_MANAGER;

/** Whether the role may invite members, remove them and set their roles */
export const managesMembers = (role) => role !== null && role <= TEAM_ROLE_ADMIN;

/** Whether the role may delete the team outright, and make other owners */
export const ownsTeam = (role) => role !== null && role <= TEAM_ROLE_OWNER;
