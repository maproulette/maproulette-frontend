import { defineMessages } from "react-intl";

/**
 * Internationalized messages for use with MemberControls
 */
export default defineMessages({
  lastOwnerTooltip: {
    id: "Team.members.lastOwner.tooltip",
    defaultMessage: "A team must always have an owner. Make someone else an owner first.",
  },
  acceptInviteLabel: {
    id: "Team.controls.acceptInvite.label",
    defaultMessage: "Join Team",
  },

  declineInviteLabel: {
    id: "Team.controls.declineInvite.label",
    defaultMessage: "Decline Invite",
  },

  removeMemberLabel: {
    id: "Team.member.controls.delete.label",
    defaultMessage: "Remove User",
  },

  leaveTeamLabel: {
    id: "Team.controls.leave.label",
    defaultMessage: "Leave Team",
  },
});
