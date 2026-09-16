import { ActivityItemType } from "../Activity/ActivityItemTypes/ActivityItemTypes";

// Target types use the item type constants on the server
export const TARGET_TYPE_PROJECT = ActivityItemType.project;
export const TARGET_TYPE_CHALLENGE = ActivityItemType.challenge;
export const TARGET_TYPE_GROUP = ActivityItemType.group;

export const TargetType = Object.freeze({
  project: TARGET_TYPE_PROJECT,
  challenge: TARGET_TYPE_CHALLENGE,
  group: TARGET_TYPE_GROUP,
});
