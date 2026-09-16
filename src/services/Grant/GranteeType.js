import { ActivityItemType } from "../Activity/ActivityItemTypes/ActivityItemTypes";

// Grantee types use the item type constants on the server
export const GRANTEE_TYPE_USER = ActivityItemType.user;
export const GRANTEE_TYPE_GROUP = ActivityItemType.group;

export const GranteeType = Object.freeze({
  user: GRANTEE_TYPE_USER,
  group: GRANTEE_TYPE_GROUP,
});
