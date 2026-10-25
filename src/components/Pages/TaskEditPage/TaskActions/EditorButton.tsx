import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { KbdBinding } from '@/components/ui/Kbd'
import { useAuthContext } from '@/contexts/AuthContext'
import { editorOptions } from '@/data/account.json'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import type { Task } from '@/types/Task'
import { EDITOR_BINDINGS } from '../useTaskShortcuts'
import { useEditorLaunch } from './useEditorLaunch'

interface EditorButtonProps {
  task: Task
}

/** Every editor except the "None" placeholder, which is a settings-only choice. */
const selectableEditors = editorOptions.filter((option) => option.value !== -1)

export const EditorButton = ({ task }: EditorButtonProps) => {
  const { t } = useIntl()
  const { user } = useAuthContext()
  const [isSaving, setIsSaving] = useState(false)
  const updateEditorMutation = api.user.useUpdateUserSettings()
  const { openEditor, openDefaultEditor, defaultEditor, isTagFix } = useEditorLaunch(task)

  const currentEditorOption =
    editorOptions.find((opt) => opt.value === defaultEditor) || editorOptions[1] // Default to iD

  // The primary button opens embedded iD for a tag fix, so it must say so
  // rather than advertising the mapper's usual editor.
  const primaryEditorLabel = isTagFix
    ? t('taskEditPage.taskActions.editorButton.editInId', undefined, 'Edit in iD')
    : currentEditorOption.label

  const handleSetDefaultEditor = async (editorValue: number) => {
    if (editorValue === defaultEditor || !user?.id) {
      return
    }

    setIsSaving(true)
    try {
      await updateEditorMutation.mutateAsync(
        {
          userId: user.id,
          settings: {
            ...user.settings,
            defaultEditor: editorValue,
          },
        },
        {
          onSuccess: () =>
            toast.success(
              t(
                'taskEditPage.taskActions.editorButton.defaultUpdated',
                undefined,
                'Default editor updated'
              )
            ),
          onError: () =>
            toast.error(
              t(
                'taskEditPage.taskActions.editorButton.defaultUpdateFailed',
                undefined,
                'Failed to update default editor'
              )
            ),
        }
      )
    } catch (error) {
      logger.error('Error setting default editor', { error })
    } finally {
      setIsSaving(false)
    }
  }

  // Get short label for mobile
  const getShortLabel = (label: string) => {
    if (label.includes('iD'))
      return t('taskEditPage.taskActions.editorButton.short.id', undefined, 'iD')
    if (label.includes('JOSM')) {
      if (label.includes('new layer'))
        return t('taskEditPage.taskActions.editorButton.short.josmLayer', undefined, 'JOSM Layer')
      if (label.includes('features'))
        return t(
          'taskEditPage.taskActions.editorButton.short.josmFeatures',
          undefined,
          'JOSM Features'
        )
      return t('taskEditPage.taskActions.editorButton.short.josm', undefined, 'JOSM')
    }
    if (label.includes('level0'))
      return t('taskEditPage.taskActions.editorButton.short.level0', undefined, 'Level0')
    if (label.includes('Rapid'))
      return t('taskEditPage.taskActions.editorButton.short.rapid', undefined, 'Rapid')
    return label
  }

  const busy = isSaving || updateEditorMutation.isPending

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        <Button
          size="sm"
          onClick={openDefaultEditor}
          className="gap-2 rounded-r-none rounded-l-full border-r border-r-background/20"
          variant="default"
          title={t(
            'taskEditPage.taskActions.editorButton.openTaskIn',
            { editor: primaryEditorLabel },
            'Open task in {editor}'
          )}
          disabled={busy}
        >
          <span className="hidden sm:inline">{primaryEditorLabel}</span>
          <span className="sm:hidden">{getShortLabel(primaryEditorLabel)}</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="default"
              className="rounded-r-full rounded-l-none px-2"
              title={t(
                'taskEditPage.taskActions.editorButton.chooseEditor',
                undefined,
                'Open in another editor, or change the default'
              )}
              disabled={busy}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {/* Opening a specific editor is its own action, listed with the key
                that does the same thing, so the shortcuts are discoverable
                right where a mapper goes looking for an editor. */}
            <DropdownMenuLabel>
              {t('taskEditPage.taskActions.editorButton.openIn', undefined, 'Open this task in:')}
            </DropdownMenuLabel>
            {selectableEditors.map((option) => (
              <DropdownMenuItem
                key={`open-${option.value}`}
                onClick={() => openEditor(option.value)}
                disabled={busy}
              >
                <span className="flex-1">{option.label}</span>
                {EDITOR_BINDINGS[option.value] && (
                  <KbdBinding binding={EDITOR_BINDINGS[option.value]} />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>
              {t(
                'taskEditPage.taskActions.editorButton.setDefaultEditor',
                undefined,
                'Set Default Editor:'
              )}
            </DropdownMenuLabel>
            {selectableEditors.map((option) => (
              <DropdownMenuItem
                key={`default-${option.value}`}
                onClick={() => handleSetDefaultEditor(option.value)}
                className={
                  option.value === defaultEditor ? 'bg-zinc-100 font-medium dark:bg-slate-800' : ''
                }
                disabled={busy}
              >
                <span className="mr-2">{option.value === defaultEditor ? '✓' : ' '}</span>
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
