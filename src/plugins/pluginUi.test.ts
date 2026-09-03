// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { pluginUi } from './pluginUi'

const EXPOSED_COMPONENTS = [
  'Alert',
  'AlertDescription',
  'AlertTitle',
  'Badge',
  'Button',
  'Card',
  'CardContent',
  'CardDescription',
  'CardFooter',
  'CardHeader',
  'CardTitle',
  'Collapsible',
  'CollapsibleContent',
  'CollapsibleTrigger',
  'CommentsHistoryTab',
  'Dialog',
  'DialogContent',
  'DialogDescription',
  'DialogFooter',
  'DialogHeader',
  'DialogTitle',
  'Empty',
  'EmptyContent',
  'EmptyDescription',
  'EmptyHeader',
  'EmptyTitle',
  'Label',
  'ProgressBar',
  'RadioGroup',
  'RadioGroupItem',
  'Select',
  'SelectContent',
  'SelectItem',
  'SelectTrigger',
  'SelectValue',
  'Separator',
  'SidePanel',
  'SidePanelBody',
  'SidePanelFooter',
  'SidePanelHeader',
  'SidePanelTitle',
  'Skeleton',
  'StatCard',
  'StatCardGrid',
  'Table',
  'TableBody',
  'TableCell',
  'TableHead',
  'TableHeader',
  'TableRow',
  'Tabs',
  'TabsContent',
  'TabsList',
  'TabsTrigger',
  'TaskSelectionMap',
  'Textarea',
]

describe('pluginUi', () => {
  it('exposes every component a plugin can render', () => {
    // The surface is a contract with already-deployed plugin bundles: dropping
    // or renaming an entry breaks them, so pin the whole list.
    expect(Object.keys(pluginUi).sort()).toEqual([...EXPOSED_COMPONENTS].sort())
  })

  it('exposes renderable components, not stray values', () => {
    for (const [name, component] of Object.entries(pluginUi)) {
      expect(component, `pluginUi.${name}`).toBeTruthy()
      expect(['function', 'object'], `pluginUi.${name}`).toContain(typeof component)
    }
  })
})
