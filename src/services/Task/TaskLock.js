import { TaskReviewStatus } from "./TaskReview/TaskReviewStatus";
import { isFinalStatus } from "./TaskStatus/TaskStatus";

/**
 * Returns true if an edit lock should be acquired for the given task.
 *
 * A task in a final status (Fixed/AlreadyFixed/FalsePositive) can't be worked
 * on any further, so there's nothing for a lock to protect. The one exception
 * is a task a reviewer rejected, which the mapper still has to revise and
 * resubmit. Nothing can be worked on in a paused challenge either. Locking any
 * of these would just burn the user's single allowed lock - and pop a conflict
 * dialog against whatever they're actually working on - for a task they can
 * only look at.
 *
 * The parent challenge is read from `challenge` when given, otherwise from
 * `task.parent` if it has been denormalized into the challenge object (it's a
 * bare id when it hasn't). The server enforces this too, so a caller that
 * can't supply the challenge just gets the rejection from there instead.
 *
 * Note this concerns edit locks only. Reviewers claim tasks through a separate
 * review-claim mechanism (see TaskReview's startReview) that is unaffected.
 */
export const isLockableTask = (task, challenge = null) => {
  const parentChallenge = challenge ?? (typeof task?.parent === "object" ? task.parent : null);

  if (parentChallenge?.paused) {
    return false;
  }

  return !isFinalStatus(task?.status) || task?.reviewStatus === TaskReviewStatus.rejected;
};
