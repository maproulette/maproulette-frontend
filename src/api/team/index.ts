import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Team, TeamRole, TeamUser } from '@/types/Team'
import { apiRequest } from '../client'

export const team = {
  get: (teamId: number | undefined) =>
    useQuery(
      queryOptions({
        queryKey: ['team', teamId],
        queryFn: () => apiRequest.get(`api/v2/team/${teamId}`).json<Team>(),
        enabled: !!teamId,
      })
    ),

  members: (teamId: number | undefined) =>
    useQuery(
      queryOptions({
        queryKey: ['team', teamId, 'members'],
        queryFn: () => apiRequest.get(`api/v2/team/${teamId}/userMembers`).json<TeamUser[]>(),
        enabled: !!teamId,
      })
    ),

  findTeamsByName: (q: string, enabled: boolean = true) =>
    useQuery(
      queryOptions({
        queryKey: ['team', 'find', q],
        queryFn: () =>
          apiRequest.get('api/v2/teams/find', { searchParams: { query: q } }).json<Team[]>(),
        enabled: enabled && q.length > 0,
        staleTime: 10_000,
      })
    ),

  useCreateTeam: () => {
    const queryClient = useQueryClient()
    return useMutation({
      // `id` and `groupType` are required by the backend's shared Group JSON
      // reader but are discarded server-side (a real id is DB-assigned on
      // insert, and groupType is always forced to GROUP_TYPE_TEAM) — send
      // placeholders purely to satisfy that parsing requirement.
      mutationFn: (payload: { name: string; description?: string; avatarURL?: string }) =>
        apiRequest.post('api/v2/team', { json: { id: 0, groupType: 0, ...payload } }).json<Team>(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user'] })
      },
    })
  },

  useUpdateTeam: () => {
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
        queryClient.invalidateQueries({ queryKey: ['team', teamId] })
      },
    })
  },

  useDeleteTeam: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (teamId: number) => apiRequest.delete(`api/v2/team/${teamId}`).json<void>(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user'] })
        queryClient.invalidateQueries({ queryKey: ['team'] })
      },
    })
  },

  useInviteMember: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ teamId, userId, role }: { teamId: number; userId: number; role: TeamRole }) =>
        apiRequest.put(`api/v2/team/${teamId}/user/${userId}/invite/${role}`).json<TeamUser>(),
      onSuccess: (_res, { teamId }) => {
        queryClient.invalidateQueries({ queryKey: ['team', teamId, 'members'] })
      },
    })
  },

  useAcceptInvite: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (teamId: number) =>
        apiRequest.put(`api/v2/team/${teamId}/invite/accept`).json<TeamUser>(),
      onSuccess: (_res, teamId) => {
        queryClient.invalidateQueries({ queryKey: ['team', teamId] })
        queryClient.invalidateQueries({ queryKey: ['user'] })
      },
    })
  },

  useDeclineInvite: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (teamId: number) =>
        apiRequest.delete(`api/v2/team/${teamId}/invite`).json<void>(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user'] })
      },
    })
  },

  useChangeRole: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ teamId, userId, role }: { teamId: number; userId: number; role: TeamRole }) =>
        apiRequest.put(`api/v2/team/${teamId}/user/${userId}/role/${role}`).json<TeamUser>(),
      onSuccess: (_res, { teamId }) => {
        queryClient.invalidateQueries({ queryKey: ['team', teamId, 'members'] })
      },
    })
  },

  useRemoveMember: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) =>
        apiRequest.delete(`api/v2/team/${teamId}/user/${userId}/`).json<void>(),
      onSuccess: (_res, { teamId }) => {
        queryClient.invalidateQueries({ queryKey: ['team', teamId, 'members'] })
      },
    })
  },
}
