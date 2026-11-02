import { List, Map as MapIcon } from 'lucide-react'
import { useState } from 'react'
import { DrawerPortalTarget } from '@/components/TaskInfoPanel/DrawerPortalContext'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useIntl } from '@/i18n'
import { ChallengeList } from './ChallengeList'
import { useExploreChallengesSearchContext } from './contexts/ExploreChallengesSearchContext'
import { ExploreChallengesMap } from './ExploreChallengesMap'

export const ExploreChallengesResults = () => {
  const { t } = useIntl()
  const { viewMode } = useExploreChallengesSearchContext()
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list')

  if (viewMode === 'grid-map') {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Mobile: tab switcher */}
        <div className="flex-1 md:hidden">
          <Tabs
            value={mobileTab}
            onValueChange={(v) => setMobileTab(v as 'list' | 'map')}
            className="flex flex-col"
          >
            <div className="border-zinc-200 border-b bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
              <TabsList className="w-full">
                <TabsTrigger value="list">
                  <List />
                  <span>{t({ id: 'exploreChallenges.results.tabList', defaultMessage: 'List' })}</span>
                </TabsTrigger>
                <TabsTrigger value="map">
                  <MapIcon />
                  <span>{t({ id: 'common.map', defaultMessage: 'Map' })}</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
          <div className="relative h-full">
            {mobileTab === 'list' ? <ChallengeList /> : <ExploreChallengesMap />}
          </div>
        </div>

        {/* Desktop: resizable panels */}
        <div className="hidden min-h-0 flex-1 md:block">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={30} minSize={20} maxSize={55}>
              <div className="relative h-full overflow-hidden">
                <ChallengeList />
                <DrawerPortalTarget />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle className="ml-2" />
            <ResizablePanel defaultSize={70}>
              <div className="h-full">
                <ExploreChallengesMap />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-0 flex-1">
      <ChallengeList />
    </div>
  )
}
