import { useId, useState } from 'react'
import { toast } from 'sonner'
import { useReportChallenge } from '@/api/challenge'
import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { MarkdownContent } from '@/components/shared/MarkdownContent'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { getErrorMessage } from '@/lib/apiError'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'
import { CHALLENGE_REPORT_MAX_LENGTH, CHALLENGE_REPORT_MIN_LENGTH } from '@/types/ChallengeReport'
import { useChallengeModals } from './ChallengeModalsContext'

const MIN_CHARACTERS = CHALLENGE_REPORT_MIN_LENGTH
const MAX_CHARACTERS = CHALLENGE_REPORT_MAX_LENGTH

const getCharacterCountColor = (count: number) => {
  if (count >= MAX_CHARACTERS || count < MIN_CHARACTERS) {
    return 'text-danger'
  }
  if (count >= MAX_CHARACTERS * 0.9) {
    return 'text-warning'
  }
  return 'text-fg-muted'
}

export const ReportModal = () => {
  const { t } = useIntl()
  const { user } = useAuthContext()
  const { challenge } = useBrowsedChallengeContext()
  const { isReportModalOpen, setReportOpen } = useChallengeModals()

  const emailId = useId()
  const textId = useId()
  const confirmId = useId()
  const [reportText, setReportText] = useState('')
  const [email, setEmail] = useState(user?.settings?.email || '')
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showingPreview, setShowingPreview] = useState(false)
  const [errors, setErrors] = useState({ input: false, checkbox: false })

  const reportChallengeMutation = useReportChallenge()

  const characterCount = reportText.length

  const resetForm = () => {
    setReportText('')
    setEmail(user?.settings?.email || '')
    setIsConfirmed(false)
    setShowingPreview(false)
    setErrors({ input: false, checkbox: false })
  }

  const handleSubmit = async () => {
    if (characterCount < MIN_CHARACTERS) {
      setErrors((prev) => ({ ...prev, input: true }))
      return
    }

    if (!isConfirmed) {
      setErrors((prev) => ({ ...prev, checkbox: true }))
      return
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(
        t({
          id: 'browsedChallengePage.challengeModals.reportModal.invalidEmailError',
          defaultMessage: 'Please enter a valid email address',
        })
      )
      return
    }

    setIsSubmitting(true)
    setErrors({ input: false, checkbox: false })

    try {
      // The reporter is taken from the session server-side, and the backend
      // posts the accompanying challenge comment itself, so there is nothing
      // to assemble here.
      await reportChallengeMutation.mutateAsync({
        challengeId: challenge.id,
        comment: reportText,
        email: email.trim() || undefined,
      })

      resetForm()
      setReportOpen(false)
      toast.success(
        t({
          id: 'browsedChallengePage.challengeModals.reportModal.submitSuccess',
          defaultMessage: 'Report submitted successfully',
        })
      )
    } catch (error) {
      logger.error('Error submitting report', { error })
      toast.error(
        await getErrorMessage(
          error,
          t({
            id: 'browsedChallengePage.challengeModals.reportModal.submitError',
            defaultMessage: 'Failed to submit report. Please try again.',
          })
        )
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm()
      setReportOpen(false)
    }
  }

  return (
    <Dialog open={isReportModalOpen} onOpenChange={handleClose}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>
            {t({ id: 'common.reportChallenge', defaultMessage: 'Report Challenge' })}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {t({
              id: 'browsedChallengePage.challengeModals.reportModal.description',
              defaultMessage:
                'You are about to report a Challenge. Your report goes to the MapRoulette administrators for review, and a comment naming you is posted on the Challenge so its creator knows it was raised. Reporting a Challenge does not disable it immediately. Please explain in detail what your issue is with this challenge, if possible linking to specific OSM changesets.',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <label htmlFor={emailId} className="font-medium text-fg text-sm">
            {t({
              id: 'browsedChallengePage.challengeModals.reportModal.emailLabel',
              defaultMessage: 'Email (optional)',
            })}
          </label>
          <Input
            id={emailId}
            type="email"
            placeholder={t({
              id: 'browsedChallengePage.challengeModals.reportModal.emailPlaceholder',
              defaultMessage: 'Enter your email',
            })}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="mt-1 mb-4"
          />

          <div className="mb-2 flex items-center justify-between text-xs leading-tight">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  setShowingPreview(false)
                  setErrors((prev) => ({ ...prev, input: false }))
                }}
                className={cn(
                  'border-line-strong border-r pr-2 font-medium uppercase transition-colors',
                  !showingPreview ? 'text-link' : 'text-fg-muted hover:text-fg'
                )}
              >
                {t({ id: 'common.write', defaultMessage: 'Write' })}
              </button>
              <button
                type="button"
                onClick={() => setShowingPreview(true)}
                className={cn(
                  'pl-2 font-medium uppercase transition-colors',
                  showingPreview ? 'text-link' : 'text-fg-muted hover:text-fg'
                )}
              >
                {t({ id: 'common.preview', defaultMessage: 'Preview' })}
              </button>
            </div>
            <span className={cn('font-medium', getCharacterCountColor(characterCount))}>
              {characterCount}/{MAX_CHARACTERS}
            </span>
          </div>

          {showingPreview ? (
            <div className="min-h-32 rounded border-2 border-line-strong bg-inset p-2">
              {reportText.trim() ? (
                <MarkdownContent autoLink={false}>{reportText}</MarkdownContent>
              ) : (
                <p className="text-fg-muted">
                  {t({ id: 'common.nothingToPreview', defaultMessage: 'Nothing to preview' })}
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded border-2 border-line-strong bg-muted">
              <Textarea
                id={textId}
                rows={4}
                placeholder={t({
                  id: 'browsedChallengePage.challengeModals.reportModal.textPlaceholder',
                  defaultMessage: 'Enter text here',
                })}
                value={reportText}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= MAX_CHARACTERS) {
                    setReportText(value)
                    setErrors((prev) => ({ ...prev, input: false }))
                  }
                }}
                disabled={isSubmitting}
                className="w-full resize-none appearance-none whitespace-pre-wrap break-all border-none bg-transparent p-3 font-mono text-sm outline-none placeholder:text-fg-muted"
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
              />
            </div>
          )}

          <div className="mt-4 flex items-center gap-2">
            <Checkbox
              id={confirmId}
              checked={isConfirmed}
              onCheckedChange={(checked) => {
                setIsConfirmed(checked === true)
                setErrors((prev) => ({ ...prev, checkbox: false }))
              }}
              disabled={isSubmitting}
            />
            <label htmlFor={confirmId} className="cursor-pointer text-fg text-sm">
              {t({
                id: 'browsedChallengePage.challengeModals.reportModal.confirmLabel',
                defaultMessage: 'I have attempted to contact the Challenge creator',
              })}
            </label>
          </div>

          {errors.input && (
            <div className="mt-2 text-danger text-sm">
              {t(
                {
                  id: 'browsedChallengePage.challengeModals.reportModal.minLengthError',
                  defaultMessage:
                    '{min, plural, one {Report must be at least # character} other {Report must be at least # characters}}',
                },
                { min: MIN_CHARACTERS }
              )}
            </div>
          )}
          {errors.checkbox && (
            <div className="mt-2 text-danger text-sm">
              {t({
                id: 'browsedChallengePage.challengeModals.reportModal.checkboxError',
                defaultMessage: "Confirm that you've tried contacting the challenge creator.",
              })}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleSubmit} disabled={isSubmitting} className="px-8">
            {isSubmitting
              ? t({ id: 'common.submitting', defaultMessage: 'Submitting...' })
              : t({
                  id: 'browsedChallengePage.challengeModals.reportModal.submitButton',
                  defaultMessage: 'Submit Report',
                })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
