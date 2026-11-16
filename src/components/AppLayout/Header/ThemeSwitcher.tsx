import { useThemeContext } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

export const ThemeSwitcher = () => {
  const { theme, themes, handleSetTheme } = useThemeContext()

  const activeIndex = Math.max(
    0,
    themes.findIndex(({ key }) => key === theme)
  )

  return (
    <div className="relative isolate inline-flex h-8 rounded-full bg-zinc-100 p-1 dark:bg-slate-950">
      <div
        aria-hidden
        className="absolute top-1 left-1 size-6 rounded-full bg-zinc-200 transition-transform duration-300 ease-out dark:bg-slate-800"
        style={{ transform: `translateX(${activeIndex * 1.5}rem)` }}
      />
      {themes.map(({ key, icon: Icon, label }) => {
        const isActive = theme === key
        return (
          <button
            aria-label={label}
            className="relative flex size-6 cursor-pointer items-center justify-center rounded-full"
            key={key}
            onClick={() => handleSetTheme(key)}
            type="button"
          >
            <Icon
              className={cn(
                'relative z-10 size-3',
                isActive ? 'text-zinc-600 dark:text-white' : 'text-zinc-400 dark:text-slate-400'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
