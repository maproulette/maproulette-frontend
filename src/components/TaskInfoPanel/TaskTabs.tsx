import { Tabs } from '@radix-ui/react-tabs'
import { useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { api } from '@/api'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { TabsContent } from '@/components/ui/Tabs'
import type { Task } from '@/types/Task'
import { CommentsHistoryTab } from './CommentsHistoryTab'
import { OSMHistoryTab } from './OSMHistoryTab/OSMHistoryTab'
import { PropertiesTab } from './PropertiesTab/PropertiesTab'
import { TaskTabsList } from './TaskTabsList'

interface TaskTabsProps {
  task: Task
  /** Content rendered inside the "task" (Instructions) tab */
  taskTabContent?: ReactNode
  /** Extra className applied to the content wrapper inside ScrollArea */
  contentClassName?: string
}

const VALID_TABS = ['task', 'properties', 'comments', 'osm'] as const

export const TaskTabs = ({ task, taskTabContent, contentClassName }: TaskTabsProps) => {
  const search = useRouterState({ select: (s) => s.location.search }) as { tab?: string }
  const initialTab =
    search.tab && (VALID_TABS as readonly string[]).includes(search.tab) ? search.tab : 'task'
  const [activeTab, setActiveTab] = useState<string>(initialTab)

  // Honor URL changes (e.g., navigating from a notification link to ?tab=comments)
  useEffect(() => {
    if (search.tab && (VALID_TABS as readonly string[]).includes(search.tab)) {
      setActiveTab(search.tab)
    }
  }, [search.tab])

  const commentsQueryResult = api.task.getTaskComments(task.id)
  const commentsCount = commentsQueryResult.data?.length ?? 0
  const osmHistoryCount = task.changesetId && task.changesetId > 0 ? 1 : 0

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
      <TaskTabsList commentsCount={commentsCount} osmHistoryCount={osmHistoryCount} />

      <ScrollArea className="min-h-0 flex-1">
        <div className={contentClassName ?? 'p-4'}>
          <TabsContent value="task" className="mt-0">
            {taskTabContent}
          </TabsContent>
          <TabsContent value="properties" className="mt-0">
            <PropertiesTab />
          </TabsContent>
          <TabsContent value="comments" className="mt-0">
            <CommentsHistoryTab />
          </TabsContent>
          <TabsContent value="osm" className="mt-0">
            <OSMHistoryTab />
          </TabsContent>
        </div>
      </ScrollArea>
    </Tabs>
  )
}
