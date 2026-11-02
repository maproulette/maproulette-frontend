import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { CommentMarkdown } from '../CommentList/CommentMarkdown'
import { CommentMentionInput } from './CommentMentionInput'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: (v: string) => Promise<void> | void
  onCancel?: () => void
  placeholder?: string
  maxLength?: number
  submitLabel?: string
  disabled?: boolean
}

export const CommentComposer = ({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder,
  maxLength = 1000,
  submitLabel,
  disabled,
}: Props) => {
  const { t } = useIntl()
  const resolvedPlaceholder =
    placeholder ?? t({ id: 'shared.commentComposer.placeholder', defaultMessage: 'Write a comment…' })
  const resolvedSubmitLabel =
    submitLabel ?? t({ id: 'shared.commentComposer.submitLabel', defaultMessage: 'Post' })
  const [busy, setBusy] = useState(false)
  const count = value.length
  const warnThreshold = maxLength * 0.8
  const counterTone =
    count >= maxLength
      ? 'text-red-600 dark:text-red-400'
      : count >= warnThreshold
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-zinc-500 dark:text-slate-400'

  const submit = async () => {
    if (!value.trim() || busy || disabled) return
    try {
      setBusy(true)
      await onSubmit(value)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <Tabs defaultValue="write">
        <TabsList>
          <TabsTrigger value="write">{t({ id: 'common.write', defaultMessage: 'Write' })}</TabsTrigger>
          <TabsTrigger value="preview">{t({ id: 'common.preview', defaultMessage: 'Preview' })}</TabsTrigger>
        </TabsList>
        <TabsContent value="write" className="mt-2">
          <CommentMentionInput
            value={value}
            onChange={onChange}
            placeholder={resolvedPlaceholder}
            maxLength={maxLength}
            disabled={disabled || busy}
            onSubmitShortcut={submit}
          />
        </TabsContent>
        <TabsContent value="preview" className="mt-2">
          <div className="min-h-24 rounded-md border border-zinc-200 p-3 dark:border-slate-700">
            {value.trim() ? (
              <CommentMarkdown>{value}</CommentMarkdown>
            ) : (
              <span className="text-sm text-zinc-400 dark:text-slate-500">
                {t({ id: 'common.nothingToPreview', defaultMessage: 'Nothing to preview' })}
              </span>
            )}
          </div>
        </TabsContent>
      </Tabs>
      <div className="flex items-center justify-between gap-2">
        <span className={cn('text-xs tabular-nums', counterTone)}>
          {count} / {maxLength}
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
              {t({ id: 'common.cancel', defaultMessage: 'Cancel' })}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={submit}
            disabled={!value.trim() || busy || disabled || count > maxLength}
          >
            {busy
              ? t({ id: 'shared.commentComposer.posting', defaultMessage: 'Posting…' })
              : resolvedSubmitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
