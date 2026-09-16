import _filter from "lodash/filter";
import _isObject from "lodash/isObject";
import _map from "lodash/map";
import _uniq from "lodash/uniq";
import { GranteeType } from "../../services/Grant/GranteeType";
import { ROLE_SUPERUSER, Role, mostPrivilegedRole, rolesImply } from "../../services/Grant/Role";
import { TargetType } from "../../services/Grant/TargetType";
import { TeamRole } from "../../services/Team/Role";
import { AsEndUser } from "./AsEndUser";

/**
 * Provides methods specific to project and challenge management
 * with regard to the wrapped user.
 */
export class AsManager extends AsEndUser {
  /**
   * Determines if the user is the owner of the given project.
   *
   * @return true if the user is the owner, false if not or if the project is
   *              undefined.
   */
  isProjectOwner(project) {
    if (!project) {
      return false;
    }

    const osmId = this.user?.osmProfile?.id;
    return Number.isFinite(osmId) && osmId === project.owner;
  }

  /**
   * Returns the roles granted to the user user on the given project
   */
  projectRoles(project) {
    if (!this.user || !project) {
      return [];
    }

    // Combine the grants on the user with those on the project. This is
    // potentially more lenient, but helps prevent erroneous security errors in
    // the event of stale data (and the server will stop anything if the user
    // actually lacks permission)
    //
    // The server folds the project grants of every team the user belongs to
    // into their grant list, so a grant found here is not necessarily theirs.
    // Only grants made to the person count as their own; what a team confers
    // is worked out from their role in it, by teamRolesOn below.
    const userGrants = _filter(
      this.user.grants,
      (grant) =>
        grant.role === ROLE_SUPERUSER ||
        (grant.target &&
          grant.target.objectType === TargetType.project &&
          grant.target.objectId === project.id &&
          this.isGrantToSelf(grant)),
    );

    const projectGrants = _filter(
      project.grants,
      (grant) =>
        grant.grantee &&
        grant.grantee.granteeType === GranteeType.user &&
        grant.grantee.granteeId === this.user.id,
    );

    return _uniq(
      _map(userGrants.concat(projectGrants), "role").concat(
        this.teamRolesOn(TargetType.project, project.id),
      ),
    );
  }

  /**
   * Whether a grant was made to this user rather than to a team they are on.
   * A grant with no grantee recorded is treated as theirs, since the older
   * shapes the server can return simply omit it.
   */
  isGrantToSelf(grant) {
    return !grant.grantee || grant.grantee.granteeType === GranteeType.user;
  }

  /**
   * The roles this user picks up on a target through teams attached to it.
   *
   * A team is attached to a project or challenge as a whole, and what each
   * member may then do follows the role they hold in that team: an owner or
   * admin acts as an admin, a manager as write. A plain member gets nothing,
   * so belonging to a team is not the same as running its work.
   *
   * @param targetType - TargetType.project or TargetType.challenge
   * @param targetId - the id of the project or challenge
   */
  teamRolesOn(targetType, targetId) {
    const attachedTeamIds = _map(
      _filter(
        this.user?.grants,
        (grant) =>
          grant.grantee &&
          grant.grantee.granteeType === GranteeType.group &&
          grant.target &&
          grant.target.objectType === targetType &&
          grant.target.objectId === targetId,
      ),
      "grantee.granteeId",
    );

    return _filter(
      _map(attachedTeamIds, (teamId) => mostPrivilegedRole(this.groupRoles({ id: teamId }))),
      (role) => role !== undefined && role !== null && role <= Role.write,
    );
  }

  /**
   * Determines if the user's roles satisfy (meet or exceed) the given role for
   * the given project
   */
  satisfiesProjectRole(project, role) {
    if (!this.isLoggedIn()) {
      return false;
    }

    return rolesImply(role, this.projectRoles(project));
  }

  /**
   * Determines if the user has been granted a read role or higher on a project
   *
   * @returns true if the user has read access, false otherwise.
   */
  canReadProject(project) {
    return this.satisfiesProjectRole(project, Role.read);
  }

  /**
   * Determines if the user has been granted a write role or higher on a
   * project
   *
   * @returns true if the user has read access, false otherwise.
   */
  canWriteProject(project) {
    return this.satisfiesProjectRole(project, Role.write);
  }

  /**
   * Determines if the user is a project manager of the given project. Any user
   * with at least read access to the project is considered a manager.
   *
   * @returns true if the user can manage the project, false otherwise.
   */
  canManage(project) {
    return this.satisfiesProjectRole(project, Role.read);
  }

  /**
   * Determines if the given user has been granted an admin role on the project
   * (or is a superuser)
   *
   * @returns true if the user can administrate the project, false otherwise.
   */
  canAdministrateProject(project) {
    return this.satisfiesProjectRole(project, Role.admin);
  }

  /**
   * Determines if the given user has permission to manage the given challenge.
   *
   * > Note that if challenge is not denormalized with a parent object field,
   * > this method will return false.
   */
  canManageChallenge(challenge) {
    // A challenge can be owned by a team, or have one attached to it, either of
    // which hands it to that team's managers regardless of any role they hold
    // on the parent project
    if (this.managesOwningTeam(challenge)) {
      return true;
    }

    if (challenge?.id != null && this.teamRolesOn(TargetType.challenge, challenge.id).length > 0) {
      return true;
    }

    if (!_isObject(challenge.parent)) {
      return false;
    }

    return this.canManage(challenge.parent);
  }

  /**
   * Determines if the user runs the content of the team that owns the given
   * challenge, if a team owns it at all. Managers of a team create, edit and
   * delete its challenges.
   *
   * Like projectRoles, this reads the roles the user has been granted rather
   * than their accepted memberships, so someone invited to a team but yet to
   * accept looks like a member here. That is the more lenient direction, which
   * keeps stale data from producing spurious permission errors, and the server
   * -- which does require an accepted membership -- stops anything real.
   */
  managesOwningTeam(challenge) {
    const ownerTeamId = challenge?.ownerTeamId;
    if (!Number.isFinite(ownerTeamId)) {
      return false;
    }

    return this.satisfiesGroupRole({ id: ownerTeamId }, TeamRole.manager);
  }

  /**
   * Filters the given array of projects and returns those the user has
   * permission to manage.
   */
  manageableProjects(projects) {
    return _filter(projects, (project) => this.canManage(project));
  }

  /**
   * Filters the given list of challenges and returns those that the user
   * has permission to manage.
   */
  manageableChallenges(projects, challenges) {
    const projectIds = _map(this.manageableProjects(projects), "id");

    const projectChallenges = new Set();

    for (const challenge of challenges) {
      // A team-owned challenge belongs to that team's managers whether or not
      // they hold anything on the project it sits in
      if (this.managesOwningTeam(challenge)) {
        projectChallenges.add(challenge);
      }

      // handle both normalized and denormalized challenges
      if (projectIds.indexOf(challenge?.parent?.id ?? challenge.parent) !== -1) {
        projectChallenges.add(challenge);
      }

      if (challenge.virtualParents) {
        for (const vp of challenge.virtualParents) {
          if (projectIds.indexOf(_isObject(vp) ? vp.id : vp) !== -1) {
            if (!projectChallenges.has(challenge)) {
              projectChallenges.add(challenge);
            }
          }
        }
      }
    }

    return [...projectChallenges];
  }

  /**
   * Returns the user's granted roles on a group
   */
  groupRoles(group) {
    if (!this.user || !group) {
      return [];
    }

    return _map(
      _filter(
        this.user.grants,
        (grant) =>
          grant.role === ROLE_SUPERUSER ||
          (grant.target.objectType === TargetType.group && grant.target.objectId === group.id),
      ),
      "role",
    );
  }

  /**
   * Determines if the user's roles satisfy (meet or exceed) the given
   * role for the given group
   */
  satisfiesGroupRole(group, role) {
    if (!this.isLoggedIn()) {
      return false;
    }

    return rolesImply(role, this.groupRoles(group));
  }

  /**
   * Determines if the given has an admin role on the group (or is a superuser)
   *
   * @returns true if the user can administrate the group, false otherwise.
   */
  canAdministrateGroup(group) {
    return this.satisfiesGroupRole(group, Role.admin);
  }

  /**
   * Alias for canAdministrateGroup, as teams are groups
   */
  canAdministrateTeam(team) {
    return this.canAdministrateGroup(team);
  }
}

export default (user) => new AsManager(user);
