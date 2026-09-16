import _cloneDeep from "lodash/cloneDeep";
import { describe, expect, it } from "vitest";
import { GranteeType } from "../../services/Grant/GranteeType";
import { ROLE_SUPERUSER, Role } from "../../services/Grant/Role";
import { TargetType } from "../../services/Grant/TargetType";
import AsManager from "./AsManager";

const superGrant = { id: -1, role: ROLE_SUPERUSER };
const adminGrant123 = {
  id: 123,
  role: Role.admin,
  target: { objectType: TargetType.project, objectId: 123 },
};
const readGrant456 = {
  id: 456,
  role: Role.read,
  target: { objectType: TargetType.project, objectId: 456 },
};
const adminGrant789 = {
  id: 789,
  role: Role.admin,
  target: { objectType: TargetType.project, objectId: 789 },
};
const adminGrant101 = {
  id: 101,
  role: Role.admin,
  target: { objectType: TargetType.project, objectId: 101 },
};
const writeGrant234 = {
  id: 234,
  role: Role.write,
  target: { objectType: TargetType.project, objectId: 234 },
};
const adminGrant102 = {
  id: 102,
  role: Role.admin,
  target: { objectType: TargetType.project, objectId: 102 },
  grantee: { granteeType: GranteeType.user, granteeId: 246 },
};
const writeGrant102 = {
  id: 1021,
  role: Role.write,
  target: { objectType: TargetType.project, objectId: 102 },
  grantee: { granteeType: GranteeType.user, granteeId: 246 },
};
const readGrant102 = {
  id: 1022,
  role: Role.read,
  target: { objectType: TargetType.project, objectId: 102 },
  grantee: { granteeType: GranteeType.user, granteeId: 246 },
};
const groupAdminGrant987 = {
  id: 9871,
  role: Role.admin,
  target: { objectType: TargetType.group, objectId: 987 },
};
const groupWriteGrant987 = {
  id: 9872,
  role: Role.write,
  target: { objectType: TargetType.group, objectId: 987 },
};
// Team roles are the grant roles under team-facing names: write is a team's
// manager, read its plain member.
const groupMemberGrant987 = {
  id: 9873,
  role: Role.read,
  target: { objectType: TargetType.group, objectId: 987 },
};

const powerUser = {
  id: 246,
  grants: [adminGrant123, readGrant456, adminGrant102, readGrant102, groupAdminGrant987],
};
const writeUser = { id: 910, grants: [writeGrant234, writeGrant102, groupWriteGrant987] };
const superUser = { id: 135, grants: [superGrant] };
const normalUser = { id: 790, osmProfile: { id: 987654321 }, grants: [] };
const teamMemberUser = { id: 911, grants: [groupMemberGrant987] };

const project123 = { id: 123, grants: [adminGrant123] };
const project456 = { id: 456, grants: [readGrant456] };
const project789 = { id: 789, grants: [adminGrant789] };
const project101 = { id: 101, grants: [adminGrant101], owner: 987654321 };
const project102 = { id: 102, grants: [adminGrant102, writeGrant102, readGrant102] };
// test needs to be added for this case:
// const project103 = {id: 103, grants: []}

const challenge123_1 = { id: 1231, parent: 123 };
const challenge123_2 = { id: 1232, parent: 123 };
const challenge456_1 = { id: 4561, parent: 456 };
const challenge789_1 = { id: 7891, parent: 789 };

const group987 = { id: 987 };

describe("projectRoles", () => {
  it("returns the project roles possessed by the user", () => {
    const project = _cloneDeep(project102);
    project.grants = [];
    const manager = AsManager(powerUser);

    const roles = manager.projectRoles(project);
    expect(roles).toContain(Role.admin);
    expect(roles).toContain(Role.read);
    expect(roles).not.toContain(Role.write);
  });

  it("includes the superuser role for superusers", () => {
    const manager = AsManager(superUser);

    const roles = manager.projectRoles(project102);
    expect(roles).toContain(ROLE_SUPERUSER);
  });

  it("includes the user's granted roles from the project", () => {
    const user = _cloneDeep(powerUser);
    user.grants = [];
    const manager = AsManager(user);

    const roles = manager.projectRoles(project102);
    expect(roles).toContain(Role.admin);
    expect(roles).toContain(Role.read);
    expect(roles).toContain(Role.write);
  });

  it("returns an empty list for a user possessing none of the project's roles", () => {
    const manager = AsManager(powerUser);

    const roles = manager.projectRoles(project789);
    expect(roles).toHaveLength(0);
  });
});

describe("canManage", () => {
  it("always returns true if the user is a superuser", () => {
    const manager = AsManager(superUser);

    expect(manager.canManage(project123)).toBe(true);
    expect(manager.canManage(project456)).toBe(true);
  });

  it("returns true if the user possesses any grant on the project", () => {
    const manager = AsManager(powerUser);

    expect(manager.canManage(project123)).toBe(true);
    expect(manager.canManage(project456)).toBe(true);
    expect(manager.canManage(project789)).toBe(false);
  });

  it("returns false if the user is the project owner without grants on the project", () => {
    const manager = AsManager(normalUser);

    expect(manager.canManage(project101)).toBe(false);
  });

  it("returns false if the user is undefined", () => {
    const missingUser = AsManager(undefined);

    expect(missingUser.canManage(project123)).toBe(false);
  });
});

describe("canAdministrateProject", () => {
  it("always returns true if the user is a superuser", () => {
    const manager = AsManager(superUser);

    expect(manager.canAdministrateProject(project123)).toBe(true);
    expect(manager.canAdministrateProject(project456)).toBe(true);
  });

  it("returns false if the user is the project owner without grants on the project", () => {
    const manager = AsManager(normalUser);

    expect(manager.canAdministrateProject(project101)).toBe(false);
  });

  it("returns true if the user possesses admin role on the project", () => {
    const manager = AsManager(powerUser);

    expect(manager.canAdministrateProject(project123)).toBe(true);
  });

  it("returns false if the user merely contains non-admin role on the project", () => {
    const manager = AsManager(powerUser);

    expect(manager.canAdministrateProject(project456)).toBe(false);
  });

  it("returns false if the user is undefined", () => {
    const missingUser = AsManager(undefined);

    expect(missingUser.canAdministrateProject(project123)).toBe(false);
  });
});

describe("canReadProject", () => {
  it("always returns true if the user is a superuser", () => {
    const manager = AsManager(superUser);

    expect(manager.canReadProject(project123)).toBe(true);
    expect(manager.canReadProject(project456)).toBe(true);
  });

  it("returns true if the user possesses read role on the project", () => {
    const manager = AsManager(powerUser);

    expect(manager.canReadProject(project456)).toBe(true);
    expect(manager.canReadProject(project789)).toBe(false);
  });

  it("returns true if the user possesses write role on the project", () => {
    const manager = AsManager(writeUser);

    expect(manager.canReadProject(project102)).toBe(true);
  });

  it("returns true if the user possesses admin role on the project", () => {
    const manager = AsManager(powerUser);

    expect(manager.canReadProject(project123)).toBe(true);
  });

  it("returns false if the user is the project owner without grants on the project", () => {
    const manager = AsManager(normalUser);

    expect(manager.canReadProject(project101)).toBe(false);
  });

  it("returns false if the user is undefined", () => {
    const missingUser = AsManager(undefined);

    expect(missingUser.canReadProject(project123)).toBe(false);
  });
});

describe("canWriteProject", () => {
  it("always returns true if the user is a superuser", () => {
    const manager = AsManager(superUser);

    expect(manager.canWriteProject(project123)).toBe(true);
    expect(manager.canWriteProject(project456)).toBe(true);
  });

  it("returns false if the user is the project owner without grants on the project", () => {
    const manager = AsManager(normalUser);

    expect(manager.canWriteProject(project101)).toBe(false);
  });

  it("returns true if the user possesses admin role on the project", () => {
    const manager = AsManager(powerUser);

    expect(manager.canWriteProject(project123)).toBe(true);
  });

  it("returns true if the user possesses write role on the project", () => {
    const manager = AsManager(writeUser);

    expect(manager.canWriteProject(project102)).toBe(true);
  });

  it("returns false if the user merely contains read role on the project", () => {
    const manager = AsManager(powerUser);

    expect(manager.canWriteProject(project456)).toBe(false);
  });

  it("returns false if the user is undefined", () => {
    const missingUser = AsManager(undefined);

    expect(missingUser.canWriteProject(project123)).toBe(false);
  });
});

describe("manageableProjects", () => {
  it("returns only those projects the user can manage", () => {
    const manager = AsManager(powerUser);

    const manageable = manager.manageableProjects([project123, project456, project789]);
    expect(manageable.length).toBe(2);
    expect(manageable).toContain(project123);
    expect(manageable).toContain(project456);
  });
});

describe("manageableChallenges", () => {
  it("returns only those challenges belonging to projects the user can manage", () => {
    const manager = AsManager(powerUser);

    const manageable = manager.manageableChallenges(
      [project123, project456, project789],
      [challenge123_1, challenge123_2, challenge456_1, challenge789_1],
    );

    expect(manageable.length).toBe(3);
    expect(manageable).toContain(challenge123_1);
    expect(manageable).toContain(challenge123_2);
    expect(manageable).toContain(challenge456_1);
  });
});

describe("canManageChallenge", () => {
  // Project 789 is one no fixture user can manage, so anything that passes here
  // passes by way of the owning team rather than the parent project.
  const teamChallenge = { id: 7891, parent: project789, ownerTeamId: 987 };

  it("returns true if the user manages the team that owns the challenge", () => {
    expect(AsManager(writeUser).canManageChallenge(teamChallenge)).toBe(true);
  });

  it("returns true if the user owns or administrates that team", () => {
    expect(AsManager(powerUser).canManageChallenge(teamChallenge)).toBe(true);
  });

  it("returns false for a plain member of the owning team", () => {
    expect(AsManager(teamMemberUser).canManageChallenge(teamChallenge)).toBe(false);
  });

  it("returns false if the challenge is owned by some other team", () => {
    const otherTeamChallenge = { id: 7892, parent: project789, ownerTeamId: 654 };

    expect(AsManager(writeUser).canManageChallenge(otherTeamChallenge)).toBe(false);
  });

  it("still honors the parent project when no team owns the challenge", () => {
    // canManageChallenge needs the parent denormalized; the bare-id fixtures
    // above are what it documents as returning false.
    expect(AsManager(powerUser).canManageChallenge({ id: 1231, parent: project123 })).toBe(true);
    expect(AsManager(powerUser).canManageChallenge({ id: 7891, parent: project789 })).toBe(false);
    expect(AsManager(powerUser).canManageChallenge(challenge123_1)).toBe(false);
  });
});

describe("manageableChallenges with a team-owned challenge", () => {
  it("includes a challenge owned by a team the user manages", () => {
    const teamChallenge = { id: 7891, parent: project789, ownerTeamId: 987 };

    const manageable = AsManager(writeUser).manageableChallenges(
      [project123, project456, project789],
      [challenge789_1, teamChallenge],
    );

    expect(manageable).toEqual([teamChallenge]);
  });
});

describe("canAdministrateGroup", () => {
  it("always returns true if the user is a superuser", () => {
    const manager = AsManager(superUser);

    expect(manager.canAdministrateGroup(group987)).toBe(true);
  });

  it("returns false if the user has no grants on the group", () => {
    const manager = AsManager(normalUser);

    expect(manager.canAdministrateGroup(group987)).toBe(false);
  });

  it("returns true if the user is granted admin role on the group", () => {
    const manager = AsManager(powerUser);

    expect(manager.canAdministrateGroup(group987)).toBe(true);
  });

  it("returns false if the user granted non-admin role on the group", () => {
    const manager = AsManager(writeUser);

    expect(manager.canAdministrateGroup(group987)).toBe(false);
  });

  it("returns false if the user is undefined", () => {
    const missingUser = AsManager(undefined);

    expect(missingUser.canAdministrateGroup(group987)).toBe(false);
  });
});
