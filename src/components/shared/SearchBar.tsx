import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export const SearchBar = ({ value, onChange, placeholder, className }: SearchBarProps) => {
  const { t } = useIntl()
  return (
    <div className={cn('relative w-full md:w-96', className)}>
      <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-zinc-500 dark:text-slate-400" />
      <Input
        type="search"
        placeholder={placeholder ?? t({ id: 'shared.searchBar.placeholder', defaultMessage: 'Search...' })}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
      />
    </div>
  )
}
