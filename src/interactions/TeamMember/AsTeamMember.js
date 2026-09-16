import _map from "lodash/map";
import { mostPrivilegedRole } from "../../services/Grant/Role";
import {
  managesContent,
  managesMembers,
  messagesByTeamRole,
  ownsTeam,
} from "../../services/Team/Role";
import { TeamStatus, messagesByTeamStatus } from "../../services/Team/Status";

/**
 * Provides methods specific to team membership and management with regard to
 * the wrapped team user
 */
export class AsTeamMember {
  constructor(teamUser) {
    Object.assign(this, teamUser);
  }

  /**
   * Returns true if the user represented by this team member matches the given
   * user
   */
  isUser(user) {
    return this.userId === user.id;
  }

  /**
   * Returns the user's highest-privileged role on the team
   */
  highestRole() {
    const roles = _map(this.teamGrants, "role");
    return roles.length > 0 ? mostPrivilegedRole(roles) : null;
  }

  /**
   * Returns true if this member is the only owner the team has, and so cannot
   * be demoted or removed: the server refuses to leave a team without an owner.
   *
   * @param teamUsers - every member of the team, as returned by the server
   */
  isLastOwner(teamUsers) {
    if (!this.isTeamOwner()) {
      return false;
    }

    const owners = (teamUsers ?? []).filter((teamUser) => {
      const member = teamUser instanceof AsTeamMember ? teamUser : new AsTeamMember(teamUser);
      return member.isTeamOwner();
    });

    return owners.length <= 1;
  }

  /**
   * Returns an internationalized Message object describing the member's role
   * on the team. For active team members, the message will describe the
   * member's most privileged role on the team; for merely invited members, the
   * message simply indicates they've been invited to join the team
   */
  roleDescription() {
    if (this.isInvited()) {
      return messagesByTeamStatus[TeamStatus.invited];
    }

    const role = this.highestRole();
    // Owner is role 0, so this has to test for an absent role rather than a
    // falsy one -- an owner is the one member whose role is falsy.
    if (role === null || role === undefined) {
      // This shouldn't really happen, but just in case
      return messagesByTeamStatus[TeamStatus.member];
    }

    return messagesByTeamRole[role];
  }

  /**
   * Returns true if this team member owns their team, false if not. Only an
   * owner can delete the team or make someone else an owner.
   */
  isTeamOwner() {
    return this.isActive() && ownsTeam(this.highestRole());
  }

  /**
   * Returns true if this team member is admin of their team, false if not.
   * Owners are admins too -- they can do everything an admin can.
   */
  isTeamAdmin() {
    return this.isActive() && managesMembers(this.highestRole());
  }

  /**
   * Returns true if this team member runs the team's content -- its projects
   * and challenges -- false if not
   */
  isTeamManager() {
    return this.isActive() && managesContent(this.highestRole());
  }

  isActive() {
    return this.status === TeamStatus.member;
  }

  isInvited() {
    return this.status === TeamStatus.invited;
  }
}

export default (teamUserMember) => new AsTeamMember(teamUserMember);
