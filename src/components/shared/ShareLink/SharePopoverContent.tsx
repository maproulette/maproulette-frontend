import { Check, Copy, QrCode, Share2 } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { useShareSupport } from '@/hooks/useShareSupport'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'

interface Props {
  url: string
  title?: string
  description?: string
}

const QR_SIZE = 160

export const SharePopoverContent = ({ url, title, description }: Props) => {
  const { t } = useIntl()
  const { copy, isCopied } = useCopyToClipboard()
  const shareSupported = useShareSupport()
  const [showQr, setShowQr] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const qrId = useId()

  useEffect(() => {
    if (!showQr) return
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    // Dynamic import keeps `qrcode` out of the main bundle until the QR is requested.
    import('qrcode')
      .then(({ default: QRCode }) =>
        QRCode.toCanvas(canvas, url, {
          width: QR_SIZE,
          margin: 1,
          color: { dark: '#18181b', light: '#ffffff' },
        })
      )
      .catch((error) => {
        if (!cancelled) logger.warn('QR code render failed', { error })
      })

    return () => {
      cancelled = true
    }
  }, [showQr, url])

  const nativeShare = async () => {
    try {
      await navigator.share({ url, title, text: description })
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        logger.warn('Native share failed', { error })
      }
    }
  }

  return (
    <div className="space-y-3 p-4">
      <div className="font-medium text-sm">
        {t({ id: 'shareLink.popover.title', defaultMessage: 'Share this link' })}
      </div>
      <div className="flex gap-2">
        <Input
          readOnly
          value={url}
          className="font-mono text-xs"
          aria-label={t({ id: 'shareLink.popover.shareUrl', defaultMessage: 'Share URL' })}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => {
            copy(url)
            toast.success(
              t({ id: 'shareLink.popover.copied', defaultMessage: 'Copied to clipboard' })
            )
          }}
          aria-label={t({ id: 'common.copyUrl', defaultMessage: 'Copy URL' })}
        >
          {isCopied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowQr((v) => !v)}
          aria-expanded={showQr}
          aria-controls={qrId}
          className="flex-1"
        >
          <QrCode className="size-4" aria-hidden="true" />{' '}
          {showQr
            ? t({ id: 'shareLink.popover.hideQr', defaultMessage: 'Hide QR' })
            : t({ id: 'shareLink.popover.qrCode', defaultMessage: 'QR code' })}
        </Button>
        {shareSupported && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={nativeShare}
            className="flex-1"
          >
            <Share2 className="size-4" aria-hidden="true" />{' '}
            {t({ id: 'shareLink.popover.shareVia', defaultMessage: 'Share via…' })}
          </Button>
        )}
      </div>
      {showQr && (
        <div
          id={qrId}
          className="flex justify-center rounded-md border border-zinc-200 bg-white p-3 dark:border-slate-800"
        >
          <canvas
            ref={canvasRef}
            width={QR_SIZE}
            height={QR_SIZE}
            aria-label={t({
              id: 'shareLink.popover.qrCanvas',
              defaultMessage: 'QR code for share URL',
            })}
            role="img"
          />
        </div>
      )}
    </div>
  )
}
