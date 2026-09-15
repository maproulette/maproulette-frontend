import { useNavigate, useSearch } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useIntl } from '@/i18n'
import { TeamChallengesView } from './TeamChallengesView'
import { TeamMembersTable } from './TeamMembersTable'
import { TeamProjectsView } from './TeamProjectsView'

export const TEAM_SECTIONS = ['users', 'projects', 'challenges'] as const
export type TeamSection = (typeof TEAM_SECTIONS)[number]

/**
 * Right-hand panel of the team detail page: a header naming what a team has,
 * and the chosen list beneath it. The choice lives in the url so a particular
 * view of a team can be linked, refreshed and gone back to.
 */
export const TeamContentPanel = () => {
  const { t } = useIntl()
  const navigate = useNavigate()
  const { section = 'users' } = useSearch({ from: '/_app/teams/$teamId/' })

  const labels: Record<TeamSection, string> = {
    users: t('teams.detail.tabUsers', undefined, 'Users'),
    projects: t('teams.detail.tabProjects', undefined, 'Projects'),
    challenges: t('teams.detail.tabChallenges', undefined, 'Challenges'),
  }

  return (
    <Tabs
      value={section}
      onValueChange={(value) => navigate({ to: '.', search: { section: value as TeamSection } })}
      className="flex h-full min-h-0 min-w-0 flex-col gap-0 pl-2"
    >
      <div className="shrink-0 pb-4">
        <TabsList>
          {TEAM_SECTIONS.map((value) => (
            <TabsTrigger key={value} value={value}>
              {labels[value]}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <TabsContent value="users">
          <TeamMembersTable />
        </TabsContent>
        <TabsContent value="projects">
          <TeamProjectsView />
        </TabsContent>
        <TabsContent value="challenges">
          <TeamChallengesView />
        </TabsContent>
      </div>
    </Tabs>
  )
}
