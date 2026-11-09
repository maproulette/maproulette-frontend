import { Link } from '@tanstack/react-router'
import { ArrowLeft, TriangleAlert, X } from 'lucide-react'
import { useState } from 'react'
import { type Control, useForm, useWatch } from 'react-hook-form'
import { BASEMAP_CUSTOM, BASEMAP_NONE, bundledStyleNames } from '@/components/Map/basemap'
import { TaskPropertyQueryBuilder } from '@/components/shared/TaskPropertyQueryBuilder'
import { PRIORITY_RULE_VALUE_TYPES } from '@/components/shared/TaskPropertyQueryBuilder/backendRuleShape'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DisabledTooltip } from '@/components/ui/DisabledTooltip'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form'
import { FormSection, FormSectionGroup } from '@/components/ui/FormSection'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Textarea } from '@/components/ui/Textarea'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import {
  PRIORITY_COLOR,
  PRIORITY_MESSAGES,
  PRIORITY_TIERS,
  type TaskPriorityValue,
} from '@/types/Priority'
import { TIER_ORDER, TIER_TO_PRIORITY } from '../TaskPrioritizationPage/PrioritizationContext'
import { BulkEditConfirmDialog } from './BulkEditConfirmDialog'
import { useBulkEditContext } from './BulkEditContext'
import { bulkEditFieldLabel } from './bulkEditFieldLabels'
import {
  BASEMAP_UNCHANGED,
  type BulkEditValues,
  changedBulkEditFields,
  emptyBulkEditValues,
} from './bulkEditPayload'

const ReviewButton = ({
  control,
  isSaving,
  hasChallenges,
}: {
  control: Control<BulkEditValues>
  isSaving: boolean
  hasChallenges: boolean
}) => {
  const { t } = useIntl()
  const [
    instruction,
    additionalKeywords,
    exportableProperties,
    basemap,
    dataOriginDate,
    replacePriorities,
  ] = useWatch({
    control,
    name: [
      'instruction',
      'additionalKeywords',
      'exportableProperties',
      'basemap',
      'dataOriginDate',
      'replacePriorities',
    ],
  })
  const hasChanges =
    changedBulkEditFields({
      instruction,
      additionalKeywords,
      exportableProperties,
      basemap,
      dataOriginDate,
      replacePriorities,
    }).length > 0
  const submitBlockedReason = !hasChallenges
    ? t({
        id: 'manageChallengesBulkEdit.form.noChallenges',
        defaultMessage: 'Select at least one challenge to edit',
      })
    : !hasChanges
      ? t({
          id: 'manageChallengesBulkEdit.form.noChanges',
          defaultMessage: 'Fill in at least one field to change',
        })
      : null

  return (
    <DisabledTooltip
      show={!isSaving && submitBlockedReason !== null}
      message={submitBlockedReason ?? ''}
    >
      <Button type="submit" disabled={isSaving || submitBlockedReason !== null}>
        {t({
          id: 'manageChallengesBulkEdit.form.review',
          defaultMessage: 'Review changes',
        })}
      </Button>
    </DisabledTooltip>
  )
}

export const BulkEditForm = () => {
  const { t } = useIntl()
  const { projectId, projectName, challenges, removeChallenge, progress, failure, save, cancel } =
    useBulkEditContext()
  const [pendingValues, setPendingValues] = useState<BulkEditValues | null>(null)
  const form = useForm<BulkEditValues>({ defaultValues: emptyBulkEditValues() })

  const [basemap, replacePriorities] = useWatch({
    control: form.control,
    name: ['basemap', 'replacePriorities'],
  })
  const isSaving = progress !== null

  const handleReview = (submitted: BulkEditValues) => {
    if (submitted.basemap === BASEMAP_CUSTOM && submitted.basemapUrl.trim() === '') {
      form.setError(
        'basemapUrl',
        {
          type: 'required',
          message: t({
            id: 'manageChallengesBulkEdit.form.basemapUrlRequired',
            defaultMessage: 'Enter a tile URL for the custom basemap',
          }),
        },
        { shouldFocus: true }
      )
      return
    }
    setPendingValues(submitted)
  }

  const handleConfirm = (confirmed: BulkEditValues) => {
    setPendingValues(null)
    void save(confirmed)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleReview)}
        className="absolute inset-0 flex min-h-0 flex-col"
      >
        <FormSectionGroup className="min-h-0 flex-1 overflow-y-auto px-1 py-1">
          <Link
            to="/manage/project/$projectId"
            params={{ projectId: String(projectId) }}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:underline dark:text-slate-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t(
              {
                id: 'manageChallengesBulkEdit.form.backToProject',
                defaultMessage: 'Back to {project}',
              },
              { project: projectName ?? '' }
            )}
          </Link>

          <FormSection
            title={t(
              {
                id: 'manageChallengesBulkEdit.form.selectedTitle',
                defaultMessage:
                  '{count, plural, one {Editing # challenge} other {Editing # challenges}}',
              },
              { count: challenges.length }
            )}
          >
            {challenges.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-slate-400">
                {t({
                  id: 'manageChallengesBulkEdit.form.noneSelected',
                  defaultMessage:
                    'No challenges are selected. Go back to the project and select the challenges to edit.',
                })}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {challenges.map((challenge) => (
                  <Badge key={challenge.id} variant="secondary" className="gap-1 pr-1">
                    {challenge.name}
                    <button
                      type="button"
                      onClick={() => removeChallenge(challenge.id)}
                      disabled={isSaving}
                      className="rounded p-0.5 hover:bg-zinc-200 dark:hover:bg-slate-700"
                      aria-label={t(
                        {
                          id: 'manageChallengesBulkEdit.form.removeChallenge',
                          defaultMessage: 'Remove {name} from this edit',
                        },
                        { name: challenge.name }
                      )}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </FormSection>

          <Alert variant="warning">
            <TriangleAlert />
            <AlertTitle>
              {t({
                id: 'manageChallengesBulkEdit.form.warningTitle',
                defaultMessage: 'Filled-in fields overwrite each challenge',
              })}
            </AlertTitle>
            <AlertDescription>
              {t({
                id: 'manageChallengesBulkEdit.form.warningDescription',
                defaultMessage:
                  "Any field you fill in replaces that field's current value on every selected challenge, and you can't see here what you are overwriting. Fields you leave blank keep each challenge's own value.",
              })}
            </AlertDescription>
          </Alert>

          <FormSection title={bulkEditFieldLabel(t, 'instruction')}>
            <FormField
              control={form.control}
              name="instruction"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      rows={6}
                      aria-label={bulkEditFieldLabel(t, 'instruction')}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t({
                      id: 'manageChallengesBulkEdit.form.instructionDescription',
                      defaultMessage: 'Markdown is supported.',
                    })}
                  </FormDescription>
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection
            title={t({
              id: 'manageChallengesBulkEdit.form.discoveryTitle',
              defaultMessage: 'Discovery and exports',
            })}
          >
            <FormField
              control={form.control}
              name="additionalKeywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{bulkEditFieldLabel(t, 'additionalKeywords')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    {t({
                      id: 'manageChallengesBulkEdit.form.additionalKeywordsDescription',
                      defaultMessage:
                        "Comma-separated. Replaces each challenge's additional keywords; its category is kept.",
                    })}
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="exportableProperties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{bulkEditFieldLabel(t, 'exportableProperties')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    {t({
                      id: 'manageChallengesBulkEdit.form.exportablePropertiesDescription',
                      defaultMessage:
                        'Comma-separated task properties to include in CSV and GeoJSON exports.',
                    })}
                  </FormDescription>
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection title={bulkEditFieldLabel(t, 'basemap')}>
            <FormField
              control={form.control}
              name="basemap"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={(value) => value && field.onChange(value)}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={BASEMAP_UNCHANGED}>
                        {t({
                          id: 'manageChallengesBulkEdit.form.basemapUnchanged',
                          defaultMessage: "Leave each challenge's basemap as it is",
                        })}
                      </SelectItem>
                      <SelectItem value={BASEMAP_NONE}>
                        {t({
                          id: 'manageChallengeNew.challengeForm.basemapNone',
                          defaultMessage: "Don't override — mappers use their own",
                        })}
                      </SelectItem>
                      {bundledStyleNames().map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                      <SelectItem value={BASEMAP_CUSTOM}>
                        {t({
                          id: 'manageChallengeNew.challengeForm.basemapCustom',
                          defaultMessage: 'Custom tile layer…',
                        })}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            {basemap === BASEMAP_CUSTOM && (
              <FormField
                control={form.control}
                name="basemapUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t({
                        id: 'manageChallengeNew.challengeForm.basemapUrlLabel',
                        defaultMessage: 'Custom basemap URL',
                      })}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://some.imagerylayer.com/tile/{z}/{x}/{y}"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </FormSection>

          <FormSection title={bulkEditFieldLabel(t, 'dataOriginDate')}>
            <FormField
              control={form.control}
              name="dataOriginDate"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="date" className="w-auto" {...field} />
                  </FormControl>
                  <FormDescription>
                    {t({
                      id: 'manageChallengesBulkEdit.form.dataOriginDateDescription',
                      defaultMessage: 'The date the task data was sourced.',
                    })}
                  </FormDescription>
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection title={bulkEditFieldLabel(t, 'priorities')}>
            <FormField
              control={form.control}
              name="replacePriorities"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">
                    {t({
                      id: 'manageChallengesBulkEdit.form.replacePriorities',
                      defaultMessage:
                        'Replace the default priority and all three priority rules. Location bounds are kept.',
                    })}
                  </FormLabel>
                </FormItem>
              )}
            />
            {replacePriorities && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="priorities.defaultPriority"
                  render={({ field }) => (
                    <FormItem className="flex flex-row flex-wrap items-center gap-3">
                      <FormLabel>
                        {t({
                          id: 'taskPrioritizationPage.defaultPrioritySelect.label',
                          defaultMessage: 'Default priority',
                        })}
                      </FormLabel>
                      <RadioGroup
                        className="auto-cols-max grid-flow-col gap-4"
                        value={String(field.value)}
                        onValueChange={(v) => field.onChange(Number(v) as TaskPriorityValue)}
                      >
                        {PRIORITY_TIERS.map((p) => {
                          const id = `bulk-default-priority-${p}`
                          return (
                            <div key={p} className="flex items-center gap-1.5">
                              <RadioGroupItem id={id} value={String(p)} />
                              <Label htmlFor={id} className="gap-1.5 font-normal">
                                <span className={cn('size-2 rounded-full', PRIORITY_COLOR[p].bg)} />
                                {t(PRIORITY_MESSAGES[p])}
                              </Label>
                            </div>
                          )
                        })}
                      </RadioGroup>
                    </FormItem>
                  )}
                />
                <Tabs defaultValue="high">
                  <TabsList>
                    {TIER_ORDER.map((tier) => (
                      <TabsTrigger key={tier} value={tier}>
                        {t(PRIORITY_MESSAGES[TIER_TO_PRIORITY[tier]])}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {TIER_ORDER.map((tier) => (
                    <TabsContent key={tier} value={tier} className="pt-3">
                      <FormField
                        control={form.control}
                        name={`priorities.${tier}`}
                        render={({ field }) => (
                          <TaskPropertyQueryBuilder
                            value={field.value}
                            onChange={field.onChange}
                            valueTypes={PRIORITY_RULE_VALUE_TYPES}
                          />
                        )}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </FormSection>
        </FormSectionGroup>

        {failure && (
          <Alert variant="destructive" className="mt-4 shrink-0">
            <AlertTitle>
              {t(
                {
                  id: 'manageChallengesBulkEdit.form.failureTitle',
                  defaultMessage: '"{name}" could not be saved',
                },
                { name: failure.failedName }
              )}
            </AlertTitle>
            <AlertDescription>
              <p>{failure.message}</p>
              <p>
                {failure.savedNames.length > 0
                  ? t(
                      {
                        id: 'manageChallengesBulkEdit.form.failureSaved',
                        defaultMessage:
                          'Saved before the error: {names}. The rest were not changed.',
                      },
                      { names: failure.savedNames.join(', ') }
                    )
                  : t({
                      id: 'manageChallengesBulkEdit.form.failureNoneSaved',
                      defaultMessage: 'No challenges were changed.',
                    })}
              </p>
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-4 flex shrink-0 items-center justify-end gap-3 border-zinc-200 border-t pt-4 dark:border-slate-700">
          {progress && (
            <span className="mr-auto text-sm text-zinc-600 tabular-nums dark:text-slate-300">
              {t(
                {
                  id: 'manageChallengesBulkEdit.form.saving',
                  defaultMessage: 'Saving {saved} of {total}',
                },
                { saved: Math.min(progress.saved + 1, progress.total), total: progress.total }
              )}
            </span>
          )}
          <Button type="button" variant="outline" onClick={cancel} disabled={isSaving}>
            {t({ id: 'manageChallengesBulkEdit.form.cancel', defaultMessage: 'Cancel' })}
          </Button>
          <ReviewButton
            control={form.control}
            isSaving={isSaving}
            hasChallenges={challenges.length > 0}
          />
        </div>
      </form>
      <BulkEditConfirmDialog
        values={pendingValues}
        onCancel={() => setPendingValues(null)}
        onConfirm={handleConfirm}
      />
    </Form>
  )
}
