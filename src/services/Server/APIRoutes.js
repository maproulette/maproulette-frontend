/**
 * Generates a set of MR2 server API (v2) routes organized into a logical
 * heirarchy to abstract them a bit for the various client services. Variable
 * substitution is handled by the route-matcher package, so see its docs for
 * additional syntax and possibilities.
 *
 * @param {RouteFactory} factory - a RouteFactory instance constructed with the
 *        appropriate base URL that will be used to generate the individual
 *        routes. The appropriate API version will be set here.
 *
 * @see See [route-matcher](https://github.com/cowboy/javascript-route-matcher)
 *
 * @author [Neil Rotstan](https://github.com/nrotstan)
 */
const apiRoutes = (factory) => {
  factory.setAPIVersion("v2");

  return {
    projects: {
      all: factory.get("/projects"),
      managed: factory.get("/projects/managed"),
      featured: factory.get("/projects/featured"),
      search: factory.get("/projects/find"),
    },
    project: {
      single: factory.get("/project/:id"),
      multiple: factory.get("/projectsById"),
      challenges: factory.get("/project/:id/challenges"),
      create: factory.post("/project"),
      edit: factory.put("/project/:id"),
      activity: factory.get("/data/project/activity"),
      managers: factory.get("/user/project/:projectId"),
      comments: factory.get("/project/:id/comments"),
      setManagerPermission: factory.put("/user/:userId/project/:projectId/:role"),
      removeManager: factory.delete("/user/:userId/project/:projectId/-1"),
      delete: factory.delete("/project/:id"),
      addToVirtual: factory.post("/project/:projectId/challenge/:challengeId/add"),
      removeFromVirtual: factory.post("/project/:projectId/challenge/:challengeId/remove"),
    },
    challenges: {
      listing: factory.get("/challenges/listing"),
      featured: factory.get("/challenges/featured"),
      preferred: factory.get("/challenges/preferred"),
      search: factory.get("/challenges/extendedFind"),
      actions: factory.get("/data/project/summary"),
      activity: factory.get("/data/status/activity"),
      latestActivity: factory.get("/data/status/latestActivity"),
      withReviewTasks: factory.get("/review/challenges"),
      tagMetrics: factory.get("/data/tag/metrics"),
      bulkArchive: factory.post("/challenges/bulkArchive"),
      move: factory.post("/challenges/project/:projectId"),
    },
    challenge: {
      single: factory.get("/challenge/:id"),
      tasks: factory.get("/challenge/:id/tasks"),
      taskClusters: factory.put("/taskCluster"),
      nearbyTasks: factory.get("/challenge/:challengeId/tasksNearby/:taskId"),
      nearbyTasksWithinBoundingBox: factory.get(
        "/challenge/:challengeId/nearby/box/:left/:bottom/:right/:top",
      ),
      deleteTasks: factory.delete("/challenge/:id/tasks"),
      randomTask: factory.get("/challenge/:id/tasks/randomTasks", {
        noCache: true,
      }),
      prioritizedTask: factory.get("/challenge/:id/tasks/prioritizedTasks", {
        noCache: true,
      }),
      previousSequentialTask: factory.get("/challenge/:challengeId/previousTask/:taskId"),
      nextSequentialTask: factory.get("/challenge/:challengeId/nextTask/:taskId"),
      actions: factory.get("/data/challenge/:id"),
      activity: factory.get("/data/challenge/:id/activity"),
      comments: factory.get("/challenge/:id/comments"),
      challengeComments: factory.get("/challenge/:id/challengeComments"),
      addComment: factory.post("/challenge/:id/comment"),
      create: factory.post("/challenge"),
      edit: factory.put("/challenge/:id"),
      move: factory.post("/challenge/:challengeId/project/:projectId"),
      rebuild: factory.put("/challenge/:id/rebuild"),
      removeKeywords: factory.delete("/challenge/:id/tags"),
      uploadGeoJSON: factory.put("/challenge/:id/addFileTasks"),
      delete: factory.delete("/challenge/:id"),
      propertyKeys: factory.get("/data/challenge/:id/propertyKeys"),
      snapshotList: factory.get("/snapshot/challenge/:id/list"),
      recordSnapshot: factory.get("/snapshot/challenge/:id/record"),
      removeSnapshot: factory.delete("/snapshot/:id"),
      snapshot: factory.get("/snapshot/:id"),
      archive: factory.post("/challenge/:id/archive"),
      topTags: factory.get("/challenge/:id/topTags"),
    },
    virtualChallenge: {
      single: factory.get("/virtualchallenge/:id"),
      create: factory.post("/virtualchallenge"),
      edit: factory.put("/virtualchallenge/:id"),
      randomTask: factory.get("/virtualchallenge/:id/task", { noCache: true }),
      nearbyTasks: factory.get("/virtualchallenge/:challengeId/tasksNearby/:taskId"),
      nearbyTasksWithinBoundingBox: factory.get(
        "/virtualchallenge/:challengeId/nearby/box/:left/:bottom/:right/:top",
      ),
    },
    tasks: {
      random: factory.get("/tasks/random", { noCache: true }),
      withinBounds: factory.put("/tasks/box/:left/:bottom/:right/:top"),
      markersWithinBounds: factory.put("/markers/box/:left/:bottom/:right/:top"),
      bulkUpdate: factory.put("/tasks"),
      bulkStatusChange: factory.put("/tasks/changeStatus"),
      review: factory.get("/tasks/review"),
      reviewed: factory.get("/tasks/reviewed"),
      reviewNext: factory.get("/tasks/review/next"),
      nearbyReviewTasks: factory.get("/tasks/review/nearby/:taskId"),
      reviewMetrics: factory.get("/tasks/review/metrics"),
      reviewTagMetrics: factory.get("/tasks/review/tag/metrics"),
      fetchReviewClusters: factory.get("/taskCluster/review"),
      inCluster: factory.get("/tasksInCluster/:clusterId"),
      bundle: factory.post("/taskBundle"),
      updateBundle: factory.post("/taskBundle/:bundleId/update"),
      deleteBundle: factory.delete("/taskBundle/:bundleId"),
      fetchBundle: factory.post("/taskBundle/:bundleId"),
      bundled: {
        updateStatus: factory.put("/taskBundle/:bundleId/:status"),
        addComment: factory.post("/taskBundle/:bundleId/comment"),
        updateReviewStatus: factory.put("/taskBundle/:bundleId/review/:status"),
        updateMetaReviewStatus: factory.put("/taskBundle/:bundleId/metareview/:status"),
      },
      removeReviewRequest: factory.put("/tasks/review/remove"),
    },
    task: {
      single: factory.get("/task/:id"),
      start: factory.get("/task/:id/start"),
      release: factory.get("/task/:id/release"),
      refreshLock: factory.get("/task/:id/refreshLock"),
      startReview: factory.get("/task/:id/review/start"),
      cancelReview: factory.get("/task/:id/review/cancel"),
      updateStatus: factory.put("/task/:id/:status"),
      updateReviewStatus: factory.put("/task/:id/review/:status"),
      updateMetaReviewStatus: factory.put("/task/:id/metareview/:status"),
      comments: factory.get("/task/:id/comments"),
      addComment: factory.post("/task/:id/comment"),
      editComment: factory.put("/comment/:id"),
      create: factory.post("/task"),
      edit: factory.put("/task/:id"),
      history: factory.get("/task/:id/history"),
      tags: factory.get("/task/:id/tags"),
      updateTags: factory.get("/task/:id/tags/update"),
      testTagFix: factory.post("/change/tag/test"),
      testCooperativeWork: factory.post("/change/test"),
      applyTagFix: factory.post("/task/:id/fix/apply"),
      updateCompletionResponses: factory.put("/task/:id/responses"),
      lockTaskBundle: factory.put("/task/:taskId/lockBundle"),
      releaseMultipleTasks: factory.post("/task/bundle/unlock"),
      requestUnlock: factory.put("/task/:id/unlock/request"),
    },
    keywords: {
      find: factory.get("/keywords"),
      toggleStatus: factory.put("/keyword/:id/toggle"),
      add: factory.post("/keyword"),
    },
    users: {
      single: factory.get("/user/:id"),
      singleByUsername: factory.get("/osmuser/:username"),
      public: factory.get("/user/:id/public"),
      publicByUsername: factory.get("/osmuser/:username/public"),
      leaderboard: factory.get("/data/user/leaderboard"),
      userLeaderboard: factory.get("/data/user/:id/leaderboard"),
      reviewerLeaderboard: factory.get("/data/reviewer/leaderboard"),
      find: factory.get("/users/find/:username"),
      findPreferred: factory.get("/users/find"),
      all: factory.get("/users"),
      taskComments: factory.get("/comments/user/:id", { noCache: true }),
      challengeComments: factory.get("/challengeComments/user/:id", {
        noCache: true,
      }),
    },
    user: {
      whoami: factory.get("/user/whoami"),
      activity: factory.get("/data/user/activity"),
      metrics: factory.get("/data/user/:userId/metrics"),
      topChallenges: factory.get("/data/user/:userId/topChallenges"),
      savedChallenges: factory.get("/user/:userId/saved"),
      saveChallenge: factory.post("/user/:userId/save/:challengeId"),
      unsaveChallenge: factory.delete("/user/:userId/unsave/:challengeId"),
      savedTasks: factory.get("/user/:userId/savedTasks"),
      saveTask: factory.post("/user/:userId/saveTask/:taskId"),
      lockedTasks: factory.get("/user/:userId/lockedTasks"),
      unsaveTask: factory.delete("/user/:userId/unsaveTask/:taskId"),
      updateSettings: factory.put("/user/:userId"),
      notificationSubscriptions: factory.get("/user/:userId/notificationSubscriptions"),
      updateNotificationSubscriptions: factory.put("/user/:userId/notificationSubscriptions"),
      notifications: factory.get("/user/:userId/notifications"),
      markNotificationsRead: factory.put("/user/:userId/notifications"),
      markNotificationsUnread: factory.put("/user/:userId/notifications/unread"),
      deleteNotifications: factory.put("/user/:userId/notifications/delete"),
      announcements: factory.get("/user/announcements"),
      challengeLeaderboard: factory.get("/data/user/challengeLeaderboard"),
      projectLeaderboard: factory.get("/data/user/projectLeaderboard"),
      challengeLeaderboardForUser: factory.get("/data/user/:userId/challengeLeaderboard"),
      // projectLeaderboardForUser: factory.get("/data/user/:userId/projectLeaderboard")
    },
    teams: {
      find: factory.get("/teams/find"),
      projectManagers: factory.get("/teams/projectManagers/:projectId"),
    },
    team: {
      setProjectRole: factory.put("/team/:teamId/project/:projectId/:role"),
      removeFromProject: factory.delete("/team/:teamId/project/:projectId"),
    },
    superUser: {
      addSuperUserGrant: factory.put("/superuser/:userId"),
      deleteSuperUserGrant: factory.delete("/superuser/:userId"),
    },
  };
};

export default apiRoutes;
