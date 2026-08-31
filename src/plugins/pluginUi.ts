import type { ComponentType } from 'react'
import { TaskSelectionMap as HostTaskSelectionMap } from '@/components/Pages/TaskEditPage/TaskNearbyMap'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { CommentsHistoryTab } from '@/components/TaskInfoPanel/CommentsHistoryTab'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/Empty'
import { Label } from '@/components/ui/Label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Separator } from '@/components/ui/Separator'
import {
  SidePanel,
  SidePanelBody,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
} from '@/components/ui/SidePanel'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatCard, StatCardGrid } from '@/components/ui/StatCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Textarea } from '@/components/ui/Textarea'
import type { PluginTaskMapItem } from '@/types/Plugin'

const TaskSelectionMap = HostTaskSelectionMap as unknown as ComponentType<{
  currentTask: PluginTaskMapItem
  tasks: PluginTaskMapItem[]
  selectedTaskId: number | null
  onTaskSelect: (taskId: number | null) => void
  showSelectedBadge?: boolean
}>

/** Stable UI surface exposed to runtime plugins via PluginApiContext.ui */
export const pluginUi = {
  Button,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
  Separator,
  StatCard,
  StatCardGrid,
  ProgressBar,
  Label,
  Textarea,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  TaskSelectionMap,
  CommentsHistoryTab,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  Skeleton,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  SidePanel,
  SidePanelHeader,
  SidePanelTitle,
  SidePanelBody,
  SidePanelFooter,
} as const
