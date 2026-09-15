import { Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { BetaBanner } from '@/components/AppLayout/BetaBanner'
import { Header } from '@/components/AppLayout/Header'
import { SystemNotices } from '@/components/AppLayout/SystemNotices'
import { WebSocketEventsListener } from '@/components/AppLayout/WebSocketEventsListener'
import { CongratulateModal } from '@/components/shared/CongratulateModal'
import { KeyboardShortcutsModal } from '@/components/shared/KeyboardShortcutsModal'
import { AuthProvider } from '@/contexts/AuthContext'
import { AvatarProvider } from '@/contexts/AvatarContext'
import { ChromeProvider } from '@/contexts/ChromeContext'
import { CongratulateProvider } from '@/contexts/CongratulateContext'
import { CustomBaseLayersProvider } from '@/contexts/CustomBaseLayersContext'
import { KeyboardShortcutsProvider } from '@/contexts/KeyboardShortcutsContext'
import { NotificationsProvider } from '@/contexts/NotificationsContext'
import { PluginProvider } from '@/contexts/PluginContext'
import { useThemeContext } from '@/contexts/ThemeContext'
import { VisibleLayersProvider } from '@/contexts/VisibleLayersContext'
import { WebSocketProvider } from '@/contexts/WebSocketContext'

export const AppLayout = () => {
  const { theme } = useThemeContext()

  return (
    <AuthProvider>
      <AvatarProvider>
        <PluginProvider>
          <WebSocketProvider>
            <NotificationsProvider>
              <ChromeProvider>
                <VisibleLayersProvider>
                  <CustomBaseLayersProvider>
                    <CongratulateProvider>
                      {/* Above the header and the routed page both, so the
                          shortcuts registry covers every screen and the `?`
                          dialog can list what applies wherever the mapper is. */}
                      <KeyboardShortcutsProvider>
                        <WebSocketEventsListener />
                        <main className="mx-auto flex h-screen w-full max-w-[2560px] flex-col overflow-hidden">
                          <SystemNotices />
                          <BetaBanner />
                          <Header />
                          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                            <Outlet />
                          </div>
                        </main>
                        <CongratulateModal />
                        <KeyboardShortcutsModal />
                      </KeyboardShortcutsProvider>
                    </CongratulateProvider>
                  </CustomBaseLayersProvider>
                </VisibleLayersProvider>
              </ChromeProvider>
              <Toaster theme={theme} />
            </NotificationsProvider>
          </WebSocketProvider>
        </PluginProvider>
      </AvatarProvider>
    </AuthProvider>
  )
}
