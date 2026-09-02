import { Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { BetaBanner } from '@/components/AppLayout/BetaBanner'
import { Header } from '@/components/AppLayout/Header'
import { SystemNotices } from '@/components/AppLayout/SystemNotices'
import { WebSocketEventsListener } from '@/components/AppLayout/WebSocketEventsListener'
import { CongratulateModal } from '@/components/shared/CongratulateModal'
import { AuthProvider } from '@/contexts/AuthContext'
import { AvatarProvider } from '@/contexts/AvatarContext'
import { CongratulateProvider } from '@/contexts/CongratulateContext'
import { CustomBaseLayersProvider } from '@/contexts/CustomBaseLayersContext'
import { NavigationProvider } from '@/contexts/NavigationContext'
import { NotificationsProvider } from '@/contexts/NotificationsContext'
import { PageTitleProvider } from '@/contexts/PageTitleContext'
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
              <NavigationProvider>
                <PageTitleProvider>
                  <VisibleLayersProvider>
                    <CustomBaseLayersProvider>
                      <CongratulateProvider>
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
                      </CongratulateProvider>
                    </CustomBaseLayersProvider>
                  </VisibleLayersProvider>
                </PageTitleProvider>
              </NavigationProvider>
              <Toaster theme={theme} />
            </NotificationsProvider>
          </WebSocketProvider>
        </PluginProvider>
      </AvatarProvider>
    </AuthProvider>
  )
}
