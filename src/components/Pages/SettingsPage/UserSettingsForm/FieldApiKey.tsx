import { Check, Copy, Eye, EyeOff, RotateCcwKey } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { ButtonGroup } from '@/components/ui/ButtonGroup'
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/Form'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/InputGroup'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { RegenerateApiKeyDialog } from './RegenerateApiKeyDialog'

export const maskKey = (key: string): string => {
  if (!key) return ''
  if (key.length <= 8) return '••••••••'
  return `${key.slice(0, 4)}${'•'.repeat(Math.max(4, key.length - 8))}${key.slice(-4)}`
}

interface Props {
  apiKey: string
  userId: number | undefined
}

export const FieldApiKey = ({ apiKey, userId }: Props) => {
  const id = useId()
  const [revealed, setRevealed] = useState(false)
  const [regenerateOpen, setRegenerateOpen] = useState(false)
  const { copy, isCopied } = useCopyToClipboard()

  const displayValue = apiKey ? (revealed ? apiKey : maskKey(apiKey)) : ''

  return (
    <FormItem>
      <FormLabel htmlFor={id}>Key</FormLabel>
      <FormControl>
        <ButtonGroup className="w-full">
          <InputGroup>
            <InputGroupInput
              id={id}
              value={displayValue}
              placeholder={apiKey ? '' : 'No API key assigned'}
              readOnly
              aria-label="API key"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                aria-label={revealed ? 'Hide API key' : 'Reveal API key'}
                aria-pressed={revealed}
                title={revealed ? 'Hide' : 'Reveal'}
                size="icon-xs"
                onClick={() => setRevealed((prev) => !prev)}
                disabled={!apiKey}
              >
                {revealed ? <EyeOff /> : <Eye />}
              </InputGroupButton>
              <InputGroupButton
                type="button"
                aria-label="Copy API key"
                title="Copy"
                size="icon-xs"
                onClick={() => {
                  if (!apiKey) return
                  copy(apiKey)
                  toast.success('Copied to clipboard')
                }}
                disabled={!apiKey}
              >
                {isCopied ? <Check /> : <Copy />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <Button
            type="button"
            variant="outline"
            aria-label="Regenerate API key"
            title="Regenerate"
            onClick={() => setRegenerateOpen(true)}
            disabled={!userId}
          >
            <RotateCcwKey aria-hidden="true" />
          </Button>
        </ButtonGroup>
      </FormControl>
      <FormMessage />
      {userId !== undefined && (
        <RegenerateApiKeyDialog
          userId={userId}
          open={regenerateOpen}
          onOpenChange={setRegenerateOpen}
        />
      )}
    </FormItem>
  )
}
