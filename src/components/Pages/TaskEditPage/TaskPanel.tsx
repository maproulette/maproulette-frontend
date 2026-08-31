import { useLocation } from '@tanstack/react-router'
import { useEditorContext } from '@/components/Pages/TaskEditPage/contexts/EditorContext'
import { usePanelViewContext } from '@/components/Pages/TaskEditPage/contexts/PanelViewContext'
import { useTaskBundleContext } from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import { TaskTab } from '@/components/TaskInfoPanel/TaskTab/TaskTab'
import { TaskTabs } from '@/components/TaskInfoPanel/TaskTabs'
import { Drawer } from '@/components/ui/Drawer'
import { usePluginContext } from '@/contexts/PluginContext'
import { DescriptionPanel } from './DescriptionPanel'
import { TaskActions } from './TaskActions/TaskActions'
import { TaskInfoHeader } from './TaskInfoHeader'

export const TaskPanel = () => {
  const location = useLocation()
  const { task, isLocked } = useTaskContext()
  const { taskActionPanels } = usePluginContext()
  const { setSelectedMarker } = useTaskMapContext()
  const { highlightIdEntityRef, activeView } = useEditorContext()
  const { setDrawerTaskId, drawerOpen, viewedTask, isViewedTaskInBundle } = useTaskBundleContext()
  const { view } = usePanelViewContext()

  const handleCloseDrawer = () => {
    setDrawerTaskId(null)
    setSelectedMarker(null)
    if (activeView === 'id') highlightIdEntityRef.current?.(null)
  }

  const search = (location.search as Record<string, unknown>) ?? {}
  const panelContext = { pathname: location.pathname, search, task }
  const activePanels = taskActionPanels.filter((panel) => panel.isActive?.(panelContext) ?? true)
  const replacePanels = activePanels.filter((panel) => panel.slot === 'replace')
  const appendPanels = activePanels.filter((panel) => panel.slot !== 'replace')

  // A description takes over the whole panel - there's only room for one thing at a time.
  if (view !== 'task') {
    return <DescriptionPanel view={view} />
  }

  return (
    <div className="relative flex w-full flex-col overflow-hidden md:h-full">
      {/* Primary Task Info Header */}
      <TaskInfoHeader task={task} relation="primary" isLocked={isLocked} />

      {/* Primary Task Tabs */}
      <TaskTabs task={task} contentClassName="p-4 pb-44" taskTabContent={<TaskTab task={task} />} />

      {/* Task Actions Footer - floats over content, under drawer */}
      <div className="absolute right-0 bottom-0 left-0 z-10 rounded-b-2xl border-slate-200/80 border-t bg-white px-3 pt-3 pb-3 dark:border-slate-700/50 dark:bg-slate-800">
        {replacePanels.length > 0 ? (
          replacePanels.map((panel) => {
            const PanelComponent = panel.component
            return (
              <PanelComponent
                key={panel.id}
                task={task}
                search={search}
                pathname={location.pathname}
              />
            )
          })
        ) : (
          <>
            {appendPanels.map((panel) => {
              const PanelComponent = panel.component
              return (
                <PanelComponent
                  key={panel.id}
                  task={task}
                  search={search}
                  pathname={location.pathname}
                />
              )
            })}
            <TaskActions />
          </>
        )}
      </div>

      {/* Drawer overlay for non-primary tasks */}
      <Drawer open={drawerOpen} onClose={handleCloseDrawer}>
        {/* Drawer Task Info Header */}
        <TaskInfoHeader
          task={viewedTask}
          relation={isViewedTaskInBundle ? 'bundle' : 'selection'}
          showActions={false}
          onClose={handleCloseDrawer}
        />

        {/* Drawer Task Tabs */}
        {drawerOpen && (
          <TaskTabs
            task={viewedTask}
            contentClassName="p-4 pb-44"
            taskTabContent={<TaskTab task={viewedTask} />}
          />
        )}
      </Drawer>
    </div>
  )
}
