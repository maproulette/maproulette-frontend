type WebSocketMessage = {
  messageType: string
  data: unknown
}

type SubscribeMessage = WebSocketMessage & {
  messageType: 'subscribe'
  data: {
    subscriptionName: string
  }
}

export interface NotificationNewMessage extends WebSocketMessage {
  messageType: 'notification-new'
  data: {
    userId: number
    notificationType?: number
  }
}

export interface AchievementAwardedMessage extends WebSocketMessage {
  messageType: 'achievement-awarded'
  data: {
    userId: number
    achievement: number[]
  }
}

export interface UserSummary {
  userId: number
  osmId: number
  displayName: string
  avatarURL: string
}

export interface ChallengeSummary {
  id: number
  parentId: number
  name: string
  enabled: boolean
}

export interface ProjectSummary {
  id: number
  name: string
  enabled: boolean
}

export interface TaskAction {
  task: {
    id: number
    parent: number
    status?: number | null
    name?: string
  }
  challenge: ChallengeSummary | null
  project: ProjectSummary | null
  byUser: UserSummary | null
}

export interface TaskEventMessage extends WebSocketMessage {
  messageType: 'task-claimed' | 'task-released' | 'task-completed' | 'task-update'
  data: TaskAction
}

export interface BundleTaskInfo {
  id: number
  parent: number
  status?: number | null
  name?: string
  bundleId?: number | null
  isBundlePrimary?: boolean | null
}

export interface TasksAction {
  tasks: BundleTaskInfo[]
  challenge: ChallengeSummary | null
  project: ProjectSummary | null
  byUser: UserSummary | null
}

export interface TasksEventMessage extends WebSocketMessage {
  messageType: 'tasks-claimed' | 'tasks-released' | 'tasks-update' | 'tasks-completed'
  data: TasksAction
}

export interface ReviewData {
  taskWithReview: {
    task: { id: number; parent: number; status?: number | null }
    review?: { reviewStatus?: number }
  }
}

export interface ReviewEventMessage extends WebSocketMessage {
  messageType: 'review-new' | 'review-claimed' | 'review-update'
  data: ReviewData
}

export interface TeamUpdateMessage extends WebSocketMessage {
  messageType: 'team-update'
  data: { teamId: number; userId: number | null }
}

export interface FollowUpdateMessage extends WebSocketMessage {
  messageType: 'follow-update'
  data: { followerId: number | null; followedId: number | null }
}

export interface PongMessage extends WebSocketMessage {
  messageType: 'pong'
  data: null
}

export type WebSocketMessageTypes =
  | SubscribeMessage
  | NotificationNewMessage
  | AchievementAwardedMessage
  | TaskEventMessage
  | TasksEventMessage
  | ReviewEventMessage
  | TeamUpdateMessage
  | FollowUpdateMessage
  | PongMessage
