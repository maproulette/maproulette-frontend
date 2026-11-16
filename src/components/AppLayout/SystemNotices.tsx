import { api } from '@/api'
import { MarkdownContent } from '@/components/shared/MarkdownContent'
import { useAuthContext } from '@/contexts/AuthContext'
import { acknowledgedNoticeIds, activeNotices, withAcknowledgedNotice } from '@/lib/systemNotices'
import { DismissibleBanner } from './DismissibleBanner'

/**
 * Banners for the system notices the backend serves — maintenance warnings and
 * the like. Expired notices are dropped, and a signed-in user's dismissals are
 * recorded against their account so a notice stays gone across their devices.
 * Signed-out visitors still see notices; dismissing one only lasts the session.
 */
export const SystemNotices = () => {
  const { user } = useAuthContext()
  const { data: notices } = api.user.announcements()
  const updateSettings = api.user.useUpdateUserSettings()

  if (!notices?.length) return null

  const acknowledged = acknowledgedNoticeIds(user?.properties)
  const toShow = activeNotices(notices).filter((notice) => !acknowledged.includes(notice.uuid))

  return (
    <>
      {toShow.map((notice) => (
        <DismissibleBanner
          key={notice.uuid}
          onDismiss={() => {
            if (!user) return
            updateSettings.mutate({
              userId: user.id,
              settings: user.settings ?? {},
              properties: withAcknowledgedNotice(user.properties, notice.uuid),
            })
          }}
        >
          <MarkdownContent className="text-current [&_a]:text-current [&_a]:underline">
            {notice.message}
          </MarkdownContent>
        </DismissibleBanner>
      ))}
    </>
  )
}
