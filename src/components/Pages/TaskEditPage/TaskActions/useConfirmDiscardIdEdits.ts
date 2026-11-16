import { useCallback, useRef } from 'react'
import { useOptionalEditorContext } from '@/components/Pages/TaskEditPage/contexts/EditorContext'
import { useIntl } from '@/i18n'

export const useConfirmDiscardIdEdits = () => {
  const { t } = useIntl()
  const editor = useOptionalEditorContext()
  const unsavedCountRef = useRef(0)
  unsavedCountRef.current = editor?.idUnsavedCount ?? 0
  const discardIdEditsRef = editor?.discardIdEditsRef

  return useCallback(() => {
    if (unsavedCountRef.current === 0) return true
    const message = t({
      id: 'taskEditPage.taskStatusModal.discardUnsavedChanges',
      defaultMessage:
        'You have unsaved changes in iD which will be discarded. Are you sure you want to proceed?',
    })
    if (!window.confirm(message)) return false
    discardIdEditsRef?.current?.()
    return true
  }, [discardIdEditsRef, t])
}
