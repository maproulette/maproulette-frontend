import {
  type InfiniteData,
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type { Challenge } from '@/types/Challenge'
import type { ManagedProjectsFilters, Project, ProjectManager } from '@/types/Project'
import type { ManagingTeam } from '@/types/Team'
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

// Query keys that code outside this module also invalidates or matches.
export const projectKeys = {
  all: ['project'] as const,
  /** Prefix of every project's challenge listings. */
  challenges: ['project', 'challenges'] as const,
}

export const projectOptions = (projectId: number | undefined) =>
  queryOptions({
    queryKey: ['project', projectId],
    queryFn: () => apiRequest.get(`api/v2/project/${projectId}`).json<Project>(),
    enabled: !!projectId,
  })

export const managedProjectsOptions = ({
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
} = {}) =>
  queryOptions({
    queryKey: ['project', 'managed', { limit, page, onlyEnabled, onlyOwned, searchString }],
    queryFn: () =>
      apiRequest
        .get('api/v2/projects/managed', {
          searchParams: { limit, page, onlyEnabled, onlyOwned, searchString },
        })
        .json<Project[]>(),
    placeholderData: keepPreviousData,
  })

export const managedProjectsInfiniteOptions = (filters: ManagedProjectsFilters, limit = 20) =>
  infiniteQueryOptions({
    queryKey: ['project', 'managedInfinite', { limit, ...filters }],
    queryFn: ({ pageParam }) =>
      apiRequest
        .get('api/v2/projects/managed', {
          searchParams: { limit, page: pageParam, ...filters },
        })
        .json<Project[]>(),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < limit ? undefined : allPages.length,
    placeholderData: keepPreviousData,
  })

export const projectChallengesOptions = (projectId: number | undefined, limit = 100, page = 0) =>
  queryOptions({
    queryKey: [...projectKeys.challenges, projectId, { limit, page }],
    queryFn: () =>
      apiRequest
        .get(`api/v2/project/${projectId}/challenges`, { searchParams: { limit, page } })
        .json<Challenge[]>(),
    enabled: !!projectId,
  })

export const searchProjectsOptions = ({
  search = '',
  limit = 25,
}: {
  search?: string
  limit?: number
} = {}) =>
  queryOptions({
    queryKey: ['project', 'search', { search, limit }],
    queryFn: () =>
      apiRequest
        .get('api/v2/projects/search', { searchParams: { search, limit, onlyEnabled: true } })
        .json<Project[]>(),
    enabled: search.length > 0,
    placeholderData: keepPreviousData,
  })

export const exportProjectTasksCsv = async (
  projectId: number,
  filename?: string
): Promise<void> => {
  const text = await apiRequest.get(`api/v2/project/${projectId}/tasks/extract`).text()
  const blob = new Blob([text], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename ?? `project-${projectId}-tasks.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export const useCreateProject = () => {
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
      queryClient.setQueriesData<Project[]>({ queryKey: ['project', 'managed'] }, (oldProjects) =>
        oldProjects ? [newProject, ...oldProjects] : [newProject]
      )
      queryClient.invalidateQueries({ queryKey: ['project', 'managedInfinite'] })
    },
  })
}

export const useUpdateProject = () => {
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
      const previousProject = queryClient.getQueryData<Project>(['project', projectId])
      const previousManaged = queryClient.getQueriesData<Project[]>({
        queryKey: ['project', 'managed'],
      })
      const previousManagedPages = queryClient.getQueriesData<InfiniteData<Project[]>>({
        queryKey: ['project', 'managedInfinite'],
      })
      if (previousProject) {
        queryClient.setQueryData<Project>(['project', projectId], {
          ...previousProject,
          ...updates,
        })
      }
      queryClient.setQueriesData<Project[]>({ queryKey: ['project', 'managed'] }, (oldProjects) =>
        oldProjects?.map((p) => (p.id === projectId ? { ...p, ...updates } : p))
      )
      queryClient.setQueriesData<InfiniteData<Project[]>>(
        { queryKey: ['project', 'managedInfinite'] },
        (old) =>
          old && {
            ...old,
            pages: old.pages.map((page) =>
              page.map((p) => (p.id === projectId ? { ...p, ...updates } : p))
            ),
          }
      )
      return { previousProject, previousManaged, previousManagedPages }
    },
    onError: (_error, variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData<Project>(['project', variables.projectId], context.previousProject)
      }
      for (const [queryKey, data] of [
        ...(context?.previousManaged ?? []),
        ...(context?.previousManagedPages ?? []),
      ]) {
        queryClient.setQueryData(queryKey, data)
      }
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData<Project>(['project', updatedProject.id], updatedProject)
      queryClient.setQueriesData<Project[]>({ queryKey: ['project', 'managed'] }, (oldProjects) =>
        oldProjects?.map((p) => (p.id === updatedProject.id ? updatedProject : p))
      )
      queryClient.invalidateQueries({ queryKey: ['project', 'managedInfinite'] })
    },
  })
}

export const useDeleteProject = () => {
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
      queryClient.invalidateQueries({ queryKey: ['project', 'managedInfinite'] })
    },
  })
}

/** Users managing a project, along with the roles they hold on it. */
export const projectManagersOptions = (projectId: number) =>
  queryOptions({
    queryKey: ['project', projectId, 'managers'],
    queryFn: () => apiRequest.get(`api/v2/user/project/${projectId}`).json<ProjectManager[]>(),
    enabled: !!projectId,
  })

/** Teams granted a role on a project. */
export const projectTeamManagersOptions = (projectId: number) =>
  queryOptions({
    queryKey: ['project', projectId, 'teamManagers'],
    queryFn: async () => {
      const teams = await apiRequest
        .get(`api/v2/teams/projectManagers/${projectId}`)
        .json<ManagingTeam[]>()
      return teams.map(({ team, grants }) => ({ team, roles: grants.map((g) => g.role) }))
    },
    enabled: !!projectId,
  })

/**
 * Set a user's role on a project, replacing whatever they held before. PUT
 * rather than POST, so changing someone's role doesn't leave them holding
 * two at once.
 */
export const useSetUserProjectRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, projectId, role }: ProjectRoleVariables) =>
      apiRequest.put(`api/v2/user/${userId}/project/${projectId}/${role}`).text(),
    onSuccess: (_data, { projectId }) => invalidateProjectManagers(queryClient, projectId),
  })
}

export const useRemoveUserFromProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, projectId, role }: ProjectRoleVariables) =>
      apiRequest.delete(`api/v2/user/${userId}/project/${projectId}/${role}`).text(),
    onSuccess: (_data, { projectId }) => invalidateProjectManagers(queryClient, projectId),
  })
}

export const useSetTeamProjectRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, projectId, role }: TeamRoleVariables) =>
      apiRequest.post(`api/v2/team/${teamId}/project/${projectId}/${role}`).text(),
    onSuccess: (_data, { projectId }) => invalidateProjectManagers(queryClient, projectId),
  })
}

export const useRemoveTeamFromProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, projectId }: { teamId: number; projectId: number }) =>
      apiRequest.delete(`api/v2/team/${teamId}/project/${projectId}`).text(),
    onSuccess: (_data, { projectId }) => invalidateProjectManagers(queryClient, projectId),
  })
}
