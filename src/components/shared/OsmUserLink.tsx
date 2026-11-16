import { api } from '@/api'

type OsmUserLinkProps = Omit<React.ComponentProps<'a'>, 'href'> & {
  username: string
}

/** A username linking to that user's OpenStreetMap profile. */
export const OsmUserLink = ({
  username,
  className = 'link-nav',
  children,
  ...props
}: OsmUserLinkProps) => (
  <a
    href={api.osm.osmUserProfileURL(username)}
    target="_blank"
    rel="noopener noreferrer"
    className={className}
    {...props}
  >
    {children ?? username}
  </a>
)
