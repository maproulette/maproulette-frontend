import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Challenge } from '@/types/Challenge'
import type { Project, ProjectGetResponse } from '@/types/Project'
import type { Team } from '@/types/Team'
import { seedChallengeCache } from './challenge/single'
import { apiRequest } from './client'

interface ProjectRoleVariables {
  userId: number
  projectId: number
  role: number
}

interface TeamRoleVariables {
  teamId: number
  projectId: number
  role: number
}

const invalidateProjectManagers = (
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: number
) => {
  queryClient.invalidateQueries({ queryKey: ['project', projectId, 'managers'] })
  queryClient.invalidateQueries({ queryKey: ['project', projectId, 'teamManagers'] })
}

export const project = {
  featuredProjects: ({
    limit = 10,
    onlyEnabled = true,
    page = 0,
  }: {
    limit?: number
    onlyEnabled?: boolean
    page?: number
  } = {}) => {
    const queryClient = useQueryClient()
    return useQuery(
      queryOptions({
        queryKey: ['project', 'featured', { limit, onlyEnabled, page }],
        queryFn: async () => {
          const projects = await apiRequest
            .get('api/v2/projects/featured', {
              searchParams: { limit, onlyEnabled, page },
            })
            .json<Project[]>()
          for (const p of projects) {
            queryClient.setQueryData(['project', p.id], p)
          }
          return projects
        },
      })
    )
  },

  getProject: (projectId: number | undefined) =>
    useQuery(
      queryOptions({
        queryKey: ['project', projectId],
        queryFn: () => apiRequest.get(`api/v2/project/${projectId}`).json<ProjectGetResponse>(),
        enabled: !!projectId,
      })
    ),

  getProjectOptions: (projectId: number) =>
    queryOptions({
      queryKey: ['project', projectId],
      queryFn: () => apiRequest.get(`api/v2/project/${projectId}`).json<ProjectGetResponse>(),
    }),

  getManagedProjects: ({
    limit = 50,
    page = 0,
    onlyEnabled = false,
    onlyOwned = false,
    searchString = '',
  }: {
    limit?: number
    page?: number
    onlyEnabled?: boolean
    onlyOwned?: boolean
    searchString?: string
  } = {}) => {
    const queryClient = useQueryClient()
    return useQuery(
      queryOptions({
        queryKey: ['project', 'managed', { limit, page, onlyEnabled, onlyOwned, searchString }],
        queryFn: async () => {
          const projects = await apiRequest
            .get('api/v2/projects/managed', {
              searchParams: {
                limit,
                page,
                onlyEnabled,
                onlyOwned,
                searchString,
              },
            })
            .json<Project[]>()
          for (const p of projects) {
            queryClient.setQueryData(['project', p.id], p)
          }
          return projects
        },
        placeholderData: (prev) => prev,
      })
    )
  },

  getProjectChallengesOptions: (projectId: number, limit = 100, page = 0) =>
    queryOptions({
      queryKey: ['project', 'challenges', projectId, { limit, page }],
      queryFn: async () => {
        const challenges = await apiRequest
          .get(`api/v2/project/${projectId}/challenges`, {
            searchParams: {
              limit,
              page,
            },
          })
          .json<Challenge[]>()
        return challenges
      },
      enabled: !!projectId,
    }),

  getProjectChallenges: (projectId: number | undefined, limit = 100, page = 0) => {
    const queryClient = useQueryClient()
    return useQuery({
      ...project.getProjectChallengesOptions(projectId ?? 0, limit, page),
      select: (challenges) => {
        seedChallengeCache(queryClient, challenges)
        return challenges
      },
    })
  },

  searchProjects: ({ search = '' }: { search?: string } = {}) => {
    const queryClient = useQueryClient()
    return useQuery(
      queryOptions({
        queryKey: ['project', 'search', { search }],
        queryFn: async () => {
          const projects = await apiRequest
            .get('api/v2/projects/search', {
              searchParams: {
                search,
              },
            })
            .json<Project[]>()
          for (const p of projects) {
            queryClient.setQueryData(['project', p.id], p)
          }
          return projects
        },
        enabled: search.length > 0,
      })
    )
  },

  exportProjectTasksCsv: async (projectId: number, filename?: string): Promise<void> => {
    const text = await apiRequest.get(`api/v2/project/${projectId}/tasks/extract`).text()
    const blob = new Blob([text], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename ?? `project-${projectId}-tasks.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  },

  // Mutation hooks
  useCreateProject: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (projectData: Partial<Project>) =>
        apiRequest
          .post('api/v2/project', {
            json: projectData,
          })
          .json<Project>(),
      onSuccess: (newProject) => {
        queryClient.setQueryData<Project>(['project', newProject.id], newProject)
        queryClient.setQueriesData<Project[]>(
          { queryKey: ['project', 'managed'] },
          (oldProjects) => (oldProjects ? [newProject, ...oldProjects] : [newProject])
        )
      },
    })
  },

  useUpdateProject: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ projectId, updates }: { projectId: number; updates: Partial<Project> }) =>
        apiRequest
          .put(`api/v2/project/${projectId}`, {
            json: {
              id: projectId,
              ...updates,
            },
          })
          .json<Project>(),
      // Archive / discoverable toggles read straight off these caches, so patch
      // them on click rather than after the round trip; `onSuccess` then swaps in
      // the server's copy.
      onMutate: ({ projectId, updates }) => {
        const previousProject = queryClient.getQueryData<ProjectGetResponse>(['project', projectId])
        const previousManaged = queryClient.getQueriesData<Project[]>({
          queryKey: ['project', 'managed'],
        })
        if (previousProject) {
          queryClient.setQueryData<ProjectGetResponse>(['project', projectId], {
            ...previousProject,
            ...updates,
          })
        }
        queryClient.setQueriesData<Project[]>({ queryKey: ['project', 'managed'] }, (oldProjects) =>
          oldProjects?.map((p) => (p.id === projectId ? { ...p, ...updates } : p))
        )
        return { previousProject, previousManaged }
      },
      onError: (_error, variables, context) => {
        if (context?.previousProject) {
          queryClient.setQueryData<ProjectGetResponse>(
            ['project', variables.projectId],
            context.previousProject
          )
        }
        for (const [queryKey, data] of context?.previousManaged ?? []) {
          queryClient.setQueryData(queryKey, data)
        }
      },
      onSuccess: (updatedProject) => {
        queryClient.setQueryData<ProjectGetResponse>(['project', updatedProject.id], updatedProject)
        queryClient.setQueriesData<Project[]>({ queryKey: ['project', 'managed'] }, (oldProjects) =>
          oldProjects?.map((p) => (p.id === updatedProject.id ? updatedProject : p))
        )
      },
    })
  },

  useDeleteProject: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ projectId, immediate }: { projectId: number; immediate?: boolean }) =>
        apiRequest
          .delete(`api/v2/project/${projectId}`, {
            searchParams: immediate ? { immediate: 'true' } : undefined,
          })
          .then(() => ({ projectId })),
      onSuccess: (_, variables) => {
        queryClient.removeQueries({ queryKey: ['project', variables.projectId] })
        queryClient.setQueriesData<Project[]>({ queryKey: ['project', 'managed'] }, (old) =>
          old?.filter((p) => p.id !== variables.projectId)
        )
      },
    })
  },

  getProjectStats: (projectId: number | undefined) =>
    useQuery(
      queryOptions({
        queryKey: ['project', 'data', projectId],
        queryFn: async () =>
          apiRequest.get(`api/v2/data/project/${projectId}`).json<{
            id?: number
            name?: string
            actions?: {
              total?: number
              available?: number
              fixed?: number
              falsePositive?: number
              skipped?: number
              deleted?: number
              alreadyFixed?: number
              tooHard?: number
              answered?: number
              validated?: number
              disabled?: number
              avgTimeSpent?: number
              tasksWithTime?: number
            }
          }>(),
        enabled: !!projectId,
      })
    ),

  /** Users managing a project, along with the roles they hold on it. */
  managers: (projectId: number, options?: { enabled?: boolean }) =>
    useQuery(
      queryOptions({
        queryKey: ['project', projectId, 'managers'],
        queryFn: async () => {
          const raw = await apiRequest.get(`api/v2/user/project/${projectId}`).json<unknown[]>()
          return (raw ?? []).map((entry) => {
            const manager = entry as {
              userId?: number
              id?: number
              osmProfile?: { displayName?: string; avatarURL?: string }
              displayName?: string
              roles?: number[]
              grants?: Array<{ role: number }>
            }
            const userId = manager.userId ?? manager.id ?? 0
            return {
              userId,
              avatarURL: manager.osmProfile?.avatarURL,
              displayName:
                manager.displayName ?? manager.osmProfile?.displayName ?? `User ${userId}`,
              roles: manager.roles ?? (manager.grants ?? []).map((grant) => grant.role),
            }
          })
        },
        enabled: (options?.enabled ?? true) && !!projectId,
      })
    ),

  /** Teams granted a role on a project. */
  teamManagers: (projectId: number, options?: { enabled?: boolean }) =>
    useQuery(
      queryOptions({
        queryKey: ['project', projectId, 'teamManagers'],
        queryFn: async () => {
          const raw = await apiRequest
            .get(`api/v2/teams/projectManagers/${projectId}`)
            .json<Array<{ team: Team; grants?: Array<{ role: number }> }>>()
          return (raw ?? []).map((entry) => ({
            team: entry.team,
            roles: (entry.grants ?? []).map((grant) => grant.role),
          }))
        },
        enabled: (options?.enabled ?? true) && !!projectId,
      })
    ),

  /**
   * Set a user's role on a project, replacing whatever they held before. PUT
   * rather than POST, so changing someone's role doesn't leave them holding
   * two at once.
   */
  useSetUserProjectRole: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ userId, projectId, role }: ProjectRoleVariables) =>
        apiRequest.put(`api/v2/user/${userId}/project/${projectId}/${role}`).text(),
      onSuccess: (_data, { projectId }) => invalidateProjectManagers(queryClient, projectId),
    })
  },

  useRemoveUserFromProject: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ userId, projectId, role }: ProjectRoleVariables) =>
        apiRequest.delete(`api/v2/user/${userId}/project/${projectId}/${role}`).text(),
      onSuccess: (_data, { projectId }) => invalidateProjectManagers(queryClient, projectId),
    })
  },

  useSetTeamProjectRole: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ teamId, projectId, role }: TeamRoleVariables) =>
        apiRequest.post(`api/v2/team/${teamId}/project/${projectId}/${role}`).text(),
      onSuccess: (_data, { projectId }) => invalidateProjectManagers(queryClient, projectId),
    })
  },

  useRemoveTeamFromProject: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ teamId, projectId }: { teamId: number; projectId: number }) =>
        apiRequest.delete(`api/v2/team/${teamId}/project/${projectId}`).text(),
      onSuccess: (_data, { projectId }) => invalidateProjectManagers(queryClient, projectId),
    })
  },
}
