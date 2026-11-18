import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { STATUS_BAR_COLORS, STATUS_COLOR, STATUS_PILL_COLORS } from '@/lib/taskConstants'
import { cn } from '@/lib/utils'
import palette from '@/styles/palette.css?raw'

const meta: Meta = {
  title: 'Foundation/Palette',
  parameters: { layout: 'padded' },
}

export default meta

type Story = StoryObj

const HUES = ['steel', 'mint', 'teal', 'ocean', 'lilac', 'mango', 'coral', 'sand'] as const
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

// Read from the source, since Tailwind only emits the variables that some class uses
const paletteColor = (hue: string, step: number) => {
  const match = palette.match(new RegExp(`--color-${hue}-${step}: ([^;]+);`))
  if (!match) throw new Error(`No palette color ${hue}-${step}`)
  return match[1] as string
}

export const Ramps: Story = {
  render: () => (
    <div className="grid grid-cols-[4.5rem_repeat(11,minmax(0,1fr))] gap-1">
      <span />
      {STEPS.map((step) => (
        <span key={step} className="text-center text-fg-muted text-xs">
          {step}
        </span>
      ))}
      {HUES.map((hue) => (
        <div key={hue} className="contents">
          <span className="self-center font-medium text-fg text-sm">{hue}</span>
          {STEPS.map((step) => (
            <div
              key={step}
              className="h-10 rounded border border-line"
              style={{ background: paletteColor(hue, step) }}
            />
          ))}
        </div>
      ))}
    </div>
  ),
}

const SURFACES = ['page', 'panel', 'card', 'inset', 'field', 'popover', 'muted', 'muted-strong']
const TEXT = ['fg', 'fg-muted', 'fg-subtle', 'link', 'highlight', 'success', 'warning', 'danger']
const FILLS = ['primary', 'accent', 'line', 'line-strong', 'ring']

const Swatch = ({ name }: { name: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div
      className="size-16 rounded-lg border border-line"
      style={{ background: `var(--${name})` }}
    />
    <span className="text-fg-muted text-xs">{name}</span>
  </div>
)

export const SemanticTokens: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        {SURFACES.map((name) => (
          <Swatch key={name} name={name} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {FILLS.map((name) => (
          <Swatch key={name} name={name} />
        ))}
      </div>
      <div className="flex flex-col gap-1 rounded-lg border border-line bg-panel p-4">
        {TEXT.map((name) => (
          <p key={name} className="text-sm" style={{ color: `var(--${name})` }}>
            {name}: The quick brown fox jumps over the lazy dog
          </p>
        ))}
      </div>
    </div>
  ),
}

const STATUS_NAMES: Record<number, string> = {
  0: 'Created',
  1: 'Fixed',
  2: 'Not an issue',
  3: 'Skipped',
  4: 'Deleted',
  5: 'Already fixed',
  6: "Can't complete",
  7: 'Answered',
  8: 'Validated',
  9: 'Disabled',
}

const sampleBar = (counts: Record<number, number>) =>
  Object.entries(counts).map(([id, count]) => ({
    key: id,
    percentage: count,
    color: STATUS_COLOR[Number(id)] as string,
  }))

export const TaskStatuses: Story = {
  render: () => (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-panel p-4">
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_NAMES).map(([id, name]) => (
          <span
            key={id}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium text-xs',
              STATUS_PILL_COLORS[Number(id)]
            )}
          >
            <span className={cn('size-1.5 rounded-full', STATUS_BAR_COLORS[Number(id)])} />
            {name}
          </span>
        ))}
      </div>
      <ProgressBar segments={sampleBar({ 1: 30, 5: 8, 2: 12, 6: 5 })} />
      <ProgressBar segments={sampleBar({ 1: 70, 5: 5, 2: 15, 6: 2 })} />
      <ProgressBar percentage={45} />
    </div>
  ),
}
