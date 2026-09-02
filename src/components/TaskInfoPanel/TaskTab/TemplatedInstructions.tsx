import { Check, Copy } from 'lucide-react'
import { MarkdownContent } from '@/components/shared/MarkdownContent'
import { Checkbox } from '@/components/ui/Checkbox'
import { Label } from '@/components/ui/Label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useCompletionResponses } from '@/contexts/CompletionResponsesContext'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { useIntl } from '@/i18n'
import {
  type InstructionToken,
  type OsmElementsToken,
  tokenizeInstructions,
} from '@/lib/shortCodes'

const CopyableText = ({ text }: { text: string }) => {
  const { t } = useIntl()
  const { copy, isCopied } = useCopyToClipboard()

  return (
    <span className="inline-flex items-center gap-1">
      <span>{text}</span>
      <button
        type="button"
        onClick={() => copy(text)}
        className="rounded p-0.5 text-zinc-500 hover:text-zinc-800 dark:text-slate-400 dark:hover:text-slate-100"
        aria-label={t(
          'taskInfoPanel.instructions.copy',
          { text },
          'Copy "{text}" to the clipboard'
        )}
      >
        {isCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </span>
  )
}

const CheckboxField = ({ label, name }: { label: string; name: string }) => {
  const context = useCompletionResponses()
  const checked = !!context?.responses[name]

  return (
    <span className="my-1 flex items-center gap-2">
      <Checkbox
        id={`response-${name}`}
        checked={checked}
        disabled={!context}
        onCheckedChange={(next) => context?.setResponse(name, next === true)}
      />
      <Label htmlFor={`response-${name}`} className="font-normal">
        <MarkdownContent className="inline">{label}</MarkdownContent>
      </Label>
    </span>
  )
}

const SelectField = ({
  label,
  name,
  values,
}: {
  label: string
  name: string
  values: string[]
}) => {
  const context = useCompletionResponses()
  const current = context?.responses[name]

  return (
    <span className="my-1 flex items-center gap-2">
      <Select
        value={typeof current === 'string' ? current : ''}
        disabled={!context}
        onValueChange={(next) => context?.setResponse(name, next)}
      >
        <SelectTrigger size="sm" className="w-40" id={`response-${name}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {values.map((value) => (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Label htmlFor={`response-${name}`} className="font-normal">
        <MarkdownContent className="inline">{label}</MarkdownContent>
      </Label>
    </span>
  )
}

const OSM_BASE = window.env.VITE_OSM_SERVER || 'https://www.openstreetmap.org'

const externalLinkClass = 'text-blue-600 hover:underline dark:text-blue-400'

const OsmElements = ({ elements }: { elements: OsmElementsToken['elements'] }) => (
  <span className="inline-flex flex-wrap items-center gap-1">
    {elements.map((element, i) => (
      <span key={`${element.type}-${element.id}`}>
        {i > 0 && ', '}
        <a
          href={`${OSM_BASE}/${element.type}/${element.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={externalLinkClass}
        >
          {element.type} {element.id}
        </a>
      </span>
    ))}
  </span>
)

const ViewportLink = ({ zoom, lat, lon }: { zoom: string; lat: string; lon: string }) => (
  <a
    href={`${OSM_BASE}/#map=${zoom}/${lat}/${lon}`}
    target="_blank"
    rel="noopener noreferrer"
    className={externalLinkClass}
  >
    {lat}, {lon}
  </a>
)

const renderToken = (token: InstructionToken, key: number) => {
  switch (token.kind) {
    case 'checkbox':
      return <CheckboxField key={key} label={token.label} name={token.name} />
    case 'select':
      return <SelectField key={key} label={token.label} name={token.name} values={token.values} />
    case 'copyable':
      return <CopyableText key={key} text={token.text} />
    case 'osmElements':
      return <OsmElements key={key} elements={token.elements} />
    case 'viewport':
      return <ViewportLink key={key} zoom={token.zoom} lat={token.lat} lon={token.lon} />
    default:
      return <MarkdownContent key={key}>{token.text}</MarkdownContent>
  }
}

/**
 * Task instructions with the challenge's embedded short codes expanded: form
 * fields the mapper can answer, and values they can copy. Text between the
 * codes renders as Markdown exactly as it does without them.
 */
export const TemplatedInstructions = ({ instructions }: { instructions: string }) => (
  <>{tokenizeInstructions(instructions).map((token, i) => renderToken(token, i))}</>
)
