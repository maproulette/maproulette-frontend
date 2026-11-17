import { Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { AchievementToasts } from '@/components/AppLayout/AchievementToasts'
import { Footer } from '@/components/AppLayout/Footer'
import { Header } from '@/components/AppLayout/Header'
import { SystemNotices } from '@/components/AppLayout/SystemNotices'
import { UserLocaleSync } from '@/components/AppLayout/UserLocaleSync'
import { WebSocketEventsListener } from '@/components/AppLayout/WebSocketEventsListener'
import { KeyboardShortcutsModal } from '@/components/shared/KeyboardShortcutsModal'
import { AuthProvider } from '@/contexts/AuthContext'
import { AvatarProvider } from '@/contexts/AvatarContext'
import { ChromeProvider } from '@/contexts/ChromeContext'
import { CustomBaseLayersProvider } from '@/contexts/CustomBaseLayersContext'
import { KeyboardShortcutsProvider } from '@/contexts/KeyboardShortcutsContext'
import { PluginProvider } from '@/contexts/PluginContext'
import { useThemeContext } from '@/contexts/ThemeContext'
import { WebSocketProvider } from '@/contexts/WebSocketContext'

export const AppLayout = () => {
  const { theme } = useThemeContext()

  return (
    <AuthProvider>
      <UserLocaleSync />
      <AvatarProvider>
        <PluginProvider>
          <WebSocketProvider>
            <ChromeProvider>
              <CustomBaseLayersProvider>
                <KeyboardShortcutsProvider>
                  <WebSocketEventsListener />
                  <AchievementToasts />
                  <main className="mx-auto flex h-screen w-full max-w-[2560px] flex-col overflow-hidden">
                    <SystemNotices />
                    <Header />
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                      <Outlet />
                    </div>
                    <Footer />
                  </main>
                  <KeyboardShortcutsModal />
                </KeyboardShortcutsProvider>
              </CustomBaseLayersProvider>
            </ChromeProvider>
            <Toaster theme={theme} />
          </WebSocketProvider>
        </PluginProvider>
      </AvatarProvider>
    </AuthProvider>
  )
}
