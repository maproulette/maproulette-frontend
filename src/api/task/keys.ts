// Query keys for task data that code outside src/api/task also reads or invalidates.
export const taskKeys = {
  all: ['task'] as const,
  task: (taskId: number) => ['task', taskId] as const,
  history: (taskId: number) => ['task', 'history', taskId] as const,
}
