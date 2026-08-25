import { describe, expect, it } from "vitest";
import { getLockConflict } from "./LockConflict";

describe("getLockConflict", () => {
  it("returns null when there's no response on the error", () => {
    expect(getLockConflict(new Error("network error"))).toBeNull();
  });

  it("returns null when the response status isn't 409", () => {
    const error = { response: { status: 403 }, details: { lockedTaskId: 123 } };
    expect(getLockConflict(error)).toBeNull();
  });

  it("returns null on a 409 with no lockedTaskId in the body", () => {
    const error = { response: { status: 409 }, details: { message: "conflict" } };
    expect(getLockConflict(error)).toBeNull();
  });

  it("normalizes a 409 lock-conflict body", () => {
    const error = {
      response: { status: 409 },
      details: {
        message: "User 1 already holds a lock on item 123",
        lockedTaskId: 123,
        parentName: "Some Challenge",
        bundledTasks: [124, 125],
        startedAt: "2026-01-01T00:00:00Z",
      },
    };

    expect(getLockConflict(error)).toEqual({
      lockedTaskId: 123,
      parentName: "Some Challenge",
      bundledTasks: [124, 125],
      startedAt: "2026-01-01T00:00:00Z",
      message: "User 1 already holds a lock on item 123",
    });
  });

  it("defaults parentName/bundledTasks/startedAt when absent", () => {
    const error = {
      response: { status: 409 },
      details: { message: "conflict", lockedTaskId: 123 },
    };

    expect(getLockConflict(error)).toEqual({
      lockedTaskId: 123,
      parentName: null,
      bundledTasks: [],
      startedAt: null,
      message: "conflict",
    });
  });
});
