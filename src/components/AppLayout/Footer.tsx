import type { ReactNode } from 'react'
import { api } from '@/api'
import { useIntl } from '@/i18n'
import { docsUrl } from '@/lib/documentationLinks'
import { frontendVersion } from '@/lib/version'

const FooterLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="underline-offset-2 hover:text-fg hover:underline"
  >
    {children}
  </a>
)

export const Footer = () => {
  const { t } = useIntl()
  const { data: serviceInfo } = api.service.info()
  const backendVersion = serviceInfo?.compiletime.version

  return (
    <footer className="flex h-8 shrink-0 items-center gap-4 whitespace-nowrap px-3 text-fg-muted text-xs md:px-5">
      <span className="truncate">
        {t(
          {
            id: 'appLayout.footer.projectOf',
            defaultMessage: 'MapRoulette is a project of <link>OpenStreetMap US</link>',
          },
          {
            link: (chunks) => (
              <FooterLink href="https://www.openstreetmap.us/">{chunks}</FooterLink>
            ),
          }
        )}
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-4">
        <FooterLink href={docsUrl()}>
          {t({ id: 'appLayout.footer.documentation', defaultMessage: 'Documentation' })}
        </FooterLink>
        <FooterLink href="https://github.com/maproulette/maproulette-frontend">
          {t({ id: 'appLayout.footer.github', defaultMessage: 'GitHub' })}
        </FooterLink>
        <span className="hidden gap-4 md:flex">
          <FooterLink
            href={`https://github.com/maproulette/maproulette-frontend/releases/tag/v${frontendVersion}`}
          >
            {t(
              { id: 'appLayout.footer.frontendVersion', defaultMessage: 'Frontend v{version}' },
              { version: frontendVersion }
            )}
          </FooterLink>
          {backendVersion && (
            <FooterLink
              href={`https://github.com/maproulette/maproulette-backend/releases/tag/v${backendVersion}`}
            >
              {t(
                { id: 'appLayout.footer.backendVersion', defaultMessage: 'Backend v{version}' },
                { version: backendVersion }
              )}
            </FooterLink>
          )}
        </span>
      </span>
    </footer>
  )
}
