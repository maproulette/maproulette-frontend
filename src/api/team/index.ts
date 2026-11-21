import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Challenge } from '@/types/Challenge'
import type { Project } from '@/types/Project'
import type { ManagedTeam, Team, TeamRole, TeamUser } from '@/types/Team'
import { apiRequest } from '../client'
import { userKeys } from '../user/keys'

// Query keys that code outside this module also invalidates.
export const teamKeys = {
  all: ['team'] as const,
  team: (teamId: number | undefined) => ['team', teamId] as const,
}

const membersKey = (teamId: number | undefined) => [...teamKeys.team(teamId), 'members'] as const

export const teamOptions = (teamId: number | undefined) =>
  queryOptions({
    queryKey: teamKeys.team(teamId),
    queryFn: () => apiRequest.get(`api/v2/team/${teamId}`).json<Team>(),
    enabled: !!teamId,
  })

/**
 * The teams the current user may give a challenge to — the ones whose
 * content they run, each with the image that team puts on its challenges.
 */
export const managedTeamsOptions = () =>
  queryOptions({
    queryKey: ['team', 'managed'],
    queryFn: () => apiRequest.get('api/v2/teams/managed').json<ManagedTeam[]>(),
  })

export const teamMembersOptions = (teamId: number | undefined) =>
  queryOptions({
    queryKey: membersKey(teamId),
    queryFn: () => apiRequest.get(`api/v2/team/${teamId}/userMembers`).json<TeamUser[]>(),
    enabled: !!teamId,
  })

/**
 * The projects this team manages, i.e. those it has been granted a role on.
 * The backend filters out projects the requesting user may not see.
 */
export const teamProjectsOptions = (teamId: number | undefined) =>
  queryOptions({
    queryKey: ['team', teamId, 'projects'],
    queryFn: () => apiRequest.get(`api/v2/team/${teamId}/projects`).json<Project[]>(),
    enabled: !!teamId,
  })

/**
 * The challenges this team owns, i.e. those given to it. The backend filters
 * out challenges the requesting user may not see.
 */
export const teamChallengesOptions = (teamId: number | undefined) =>
  queryOptions({
    queryKey: ['team', teamId, 'challenges'],
    queryFn: () => apiRequest.get(`api/v2/team/${teamId}/challenges`).json<Challenge[]>(),
    enabled: !!teamId,
  })

/**
 * Teams whose name matches, for pickers. The backend names the parameter
 * `name` and requires it, so sending anything else is rejected before the
 * search runs.
 */
export const findTeamsOptions = (q: string, limit = 10) =>
  queryOptions({
    queryKey: ['team', 'find', { q, limit }],
    queryFn: () =>
      apiRequest.get('api/v2/teams/find', { searchParams: { name: q, limit } }).json<Team[]>(),
    enabled: q.length > 0,
    staleTime: 10_000,
  })

export const useCreateTeam = () => {
  const queryClient = useQueryClient()
  return useMutation({
    // `id` and `groupType` are required by the backend's shared Group JSON
    // reader but are discarded server-side (a real id is DB-assigned on
    // insert, and groupType is always forced to GROUP_TYPE_TEAM) — send
    // placeholders purely to satisfy that parsing requirement.
    mutationFn: (payload: { name: string; description?: string; avatarURL?: string }) =>
      apiRequest.post('api/v2/team', { json: { id: 0, groupType: 0, ...payload } }).json<Team>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export const useUpdateTeam = () => {
  const queryClient = useQueryClient()
  return useMutation({
    // See the comment in useCreateTeam above: `id`/`groupType` are required
    // by the backend's shared Group JSON reader but ignored by this
    // endpoint, which only reads name/description/avatarURL from the body.
    mutationFn: ({
      teamId,
      payload,
    }: {
      teamId: number
      payload: { name: string; description?: string; avatarURL?: string }
    }) =>
      apiRequest
        .put(`api/v2/team/${teamId}`, { json: { id: teamId, groupType: 0, ...payload } })
        .json<Team>(),
    onSuccess: (_team, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.team(teamId) })
    },
  })
}

export const useUploadTeamAvatar = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, imageFile }: { teamId: number; imageFile: File }) => {
      const formData = new FormData()
      formData.append('image', imageFile)

      return apiRequest.post(`api/v2/team/${teamId}/avatar`, { body: formData }).json<Team>()
    },
    onSuccess: (_team, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.team(teamId) })
      // The avatar shows up on team listings hanging off the user too
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export const useDeleteTeamAvatar = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (teamId: number) => apiRequest.delete(`api/v2/team/${teamId}/avatar`).json<Team>(),
    onSuccess: (_team, teamId) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.team(teamId) })
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export const useDeleteTeam = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (teamId: number) => apiRequest.delete(`api/v2/team/${teamId}`).json<void>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      queryClient.invalidateQueries({ queryKey: teamKeys.all })
    },
  })
}

export const useInviteTeamMember = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, userId, role }: { teamId: number; userId: number; role: TeamRole }) =>
      apiRequest.post(`api/v2/team/${teamId}/user/${userId}/invite/${role}`).json<TeamUser>(),
    onSuccess: (_res, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: membersKey(teamId) })
    },
  })
}

export const useAcceptTeamInvite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (teamId: number) =>
      apiRequest.put(`api/v2/team/${teamId}/invite/accept`).json<TeamUser>(),
    onSuccess: (_res, teamId) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.team(teamId) })
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export const useDeclineTeamInvite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (teamId: number) => apiRequest.delete(`api/v2/team/${teamId}/invite`).json<void>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export const useChangeTeamMemberRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, userId, role }: { teamId: number; userId: number; role: TeamRole }) =>
      apiRequest.put(`api/v2/team/${teamId}/user/${userId}/role/${role}`).json<TeamUser>(),
    onSuccess: (_res, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: membersKey(teamId) })
    },
  })
}

export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) =>
      apiRequest.delete(`api/v2/team/${teamId}/user/${userId}/`).json<void>(),
    onSuccess: (_res, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: membersKey(teamId) })
    },
  })
}
