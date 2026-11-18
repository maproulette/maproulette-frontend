import { Link } from '@tanstack/react-router'
import { Flag, ImageIcon, Shield, Users } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { useIntl } from '@/i18n'

export const SuperAdminHome = () => {
  const { t } = useIntl()
  const pages = [
    {
      to: '/super-admin/users',
      icon: <Users className="h-6 w-6 text-link" />,
      iconBg: 'bg-accent/10',
      title: t({ id: 'common.users', defaultMessage: 'Users' }),
    },
    {
      to: '/super-admin/challenge-reports',
      icon: <Flag className="h-6 w-6 text-danger" />,
      iconBg: 'bg-danger/10',
      title: t({
        id: 'superAdminHome.cards.challengeReports.title',
        defaultMessage: 'Challenge Reports',
      }),
    },
    {
      to: '/super-admin/team-images',
      icon: <ImageIcon className="h-6 w-6 text-link" />,
      iconBg: 'bg-accent/10',
      title: t({ id: 'superAdminHome.cards.teamImages.title', defaultMessage: 'Team Images' }),
    },
  ] as const

  return (
    <div className="mx-auto px-4">
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-8 w-8 text-danger" />
        <h1 className="font-bold text-2xl text-fg tracking-tight">
          {t({ id: 'superAdminHome.title', defaultMessage: 'Super Admin Dashboard' })}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pages.map((p) => (
          <Card
            key={p.to}
            className="stretched-link-container transition-colors hover:border-line-strong"
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${p.iconBg}`}
              >
                {p.icon}
              </div>
              <CardTitle>
                <Link to={p.to} className="stretched-link">
                  {p.title}
                </Link>
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
