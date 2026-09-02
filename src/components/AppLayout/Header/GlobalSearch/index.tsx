import { Search } from 'lucide-react'
import type { RefObject } from 'react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { DocsLink } from '@/components/shared/DocsLink'
import { DropdownMenuShortcut } from '@/components/ui/DropdownMenu'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/InputGroup'
import type { SearchType } from '@/types/GlobalSearch'

const useEventListener = <
  KW extends keyof WindowEventMap,
  KH extends keyof HTMLElementEventMap & keyof SVGElementEventMap,
  T extends HTMLElement | SVGAElement = HTMLElement,
>(
  eventName: KW | KH,
  handler: (
    event: WindowEventMap[KW] | HTMLElementEventMap[KH] | SVGElementEventMap[KH] | Event
  ) => void,
  element?: RefObject<T>,
  options?: boolean | AddEventListenerOptions
) => {
  const savedHandler = useRef(handler)

  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    const targetElement: T | Window = element?.current ?? window
    if (!targetElement?.addEventListener) return

    const listener: typeof handler = (event) => {
      savedHandler.current(event)
    }

    targetElement.addEventListener(eventName, listener, options)
    return () => {
      targetElement.removeEventListener(eventName, listener, options)
    }
  }, [eventName, element, options])
}

const useOnClickOutside = <T extends HTMLElement = HTMLElement>(
  ref: RefObject<T> | RefObject<T>[],
  handler: (event: MouseEvent | TouchEvent | FocusEvent) => void,
  eventType:
    | 'mousedown'
    | 'mouseup'
    | 'touchstart'
    | 'touchend'
    | 'focusin'
    | 'focusout' = 'mousedown',
  eventListenerOptions: AddEventListenerOptions = {}
): void => {
  useEventListener(
    eventType,
    (event) => {
      const target = event.target as Node
      if (!target || !target.isConnected) return

      const isOutside = Array.isArray(ref)
        ? ref
            .filter((r) => Boolean(r.current))
            .every((r) => r.current && !r.current.contains(target))
        : ref.current && !ref.current.contains(target)

      if (isOutside) {
        handler(event as MouseEvent | TouchEvent | FocusEvent)
      }
    },
    undefined,
    eventListenerOptions
  )
}

import { GlobalSearchProvider } from '@/contexts/GlobalSearchContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { SearchTypeFilters } from './GlobalSearchDropdown/SearchTypeFilters'
import { UnifiedSearchList } from './GlobalSearchDropdown/UnifiedSearchList'
import { parseSearchInput, SEARCH_TYPE_PREFIXES } from './shared/searchTypes'

export const GlobalSearch = ({
  className,
  placeholder,
  ...props
}: React.ComponentProps<'search'> & {
  placeholder?: string
}) => {
  const { t } = useIntl()
  const resolvedPlaceholder =
    placeholder ??
    t(
      'appLayout.header.globalSearch.placeholder',
      undefined,
      'Search for challenges, tasks or projects...'
    )
  const id = useId()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [selectedSearchTypeLabel, setSelectedSearchTypeLabel] = useState<SearchType | null>(null)
  const [inputValue, setInputValue] = useState<string>('')

  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen(true)

        searchInputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useOnClickOutside(searchContainerRef, (event) => {
    const target = event.target as HTMLElement
    const isSelectPortal = target.closest('[data-radix-popper-content-wrapper]')
    if (!isSelectPortal) {
      setIsOpen(false)
    }
  })

  // Reason: parses search input into type and query - avoids re-parsing on every render
  const { searchType: parsedSearchType, query: searchQuery } = useMemo(
    () => parseSearchInput(inputValue),
    [inputValue]
  )
  const activeSearchType = selectedSearchTypeLabel || parsedSearchType

  const handleSelectSearchType = (searchType: {
    id: SearchType
    label: string
    description: string
    prefix: string
  }) => {
    setSelectedSearchTypeLabel(searchType.id)
    const newValue = searchQuery ? `${searchType.prefix} ${searchQuery}` : searchType.prefix
    setInputValue(newValue)
    setTimeout(() => {
      searchInputRef.current?.focus()
      searchInputRef.current?.setSelectionRange(newValue.length, newValue.length)
    }, 0)
  }

  const handleClearSearchType = () => {
    setSelectedSearchTypeLabel(null)
    setInputValue('')
  }

  const handleResultSelect = () => {
    setIsOpen(false)
    setInputValue('')
    setSelectedSearchTypeLabel(null)
    searchInputRef.current?.blur()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    if (selectedSearchTypeLabel) {
      const prefix = SEARCH_TYPE_PREFIXES[selectedSearchTypeLabel]
      if (!newValue.startsWith(prefix)) {
        setSelectedSearchTypeLabel(null)
      }
    } else {
      const parsed = parseSearchInput(newValue)
      setSelectedSearchTypeLabel(parsed.searchType)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault()
      setIsOpen(false)
      return
    }

    if (activeSearchType && searchInputRef.current) {
      const prefix = SEARCH_TYPE_PREFIXES[activeSearchType]
      const cursorPos = searchInputRef.current.selectionStart || 0

      if (e.key === 'Backspace' && cursorPos <= prefix.length) {
        e.preventDefault()
        handleClearSearchType()
      }
    }
  }

  const handleInputClick = () => {
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  return (
    <>
      <div
        aria-hidden
        className={cn(
          'fixed inset-0 z-[9998] bg-black/20 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setIsOpen(false)}
      />
      <search className={cn('relative z-[9999]', className)} {...props}>
        <div ref={searchContainerRef} className="relative">
          <div className="relative z-10">
            <InputGroup className="rounded-[20px] py-5 dark:border-slate-700 dark:bg-slate-800">
              <label htmlFor={id} className="sr-only">
                {resolvedPlaceholder}
              </label>
              <InputGroupInput
                ref={searchInputRef}
                id={id}
                type="search"
                placeholder={resolvedPlaceholder}
                value={inputValue}
                onChange={handleInputChange}
                onClick={handleInputClick}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                readOnly={!isOpen}
                aria-haspopup="listbox"
                aria-controls={`${id}-results`}
                aria-expanded={isOpen}
                autoComplete="off"
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div
            id={`${id}-results`}
            className={cn(
              'fixed top-[88px] right-0 left-0 z-[9999] mx-2 max-h-[calc(100vh-100px)] overflow-y-auto rounded-xl border border-zinc-200 bg-white px-3 py-3 shadow-xl transition-[opacity,visibility] duration-200 md:absolute md:top-full md:right-auto md:left-0 md:mx-0 md:mt-2 md:w-full md:max-w-[600px] dark:border-slate-800 dark:bg-slate-900',
              isOpen ? 'visible opacity-100' : 'invisible opacity-0'
            )}
            role="listbox"
          >
            <GlobalSearchProvider
              searchQuery={activeSearchType ? searchQuery : inputValue}
              isOpen={isOpen}
              onResultSelect={handleResultSelect}
              onSelectSearchType={handleSelectSearchType}
            >
              {!activeSearchType ? (
                <UnifiedSearchList />
              ) : (
                <SearchTypeFilters searchType={activeSearchType} />
              )}
            </GlobalSearchProvider>
            <div className="mt-2 border-zinc-200 border-t pt-2 dark:border-slate-800">
              <DocsLink page="searchboxShortCommands" className="text-xs">
                {t(
                  'appLayout.header.globalSearch.docsLink',
                  undefined,
                  'Search shortcuts and short commands'
                )}
              </DocsLink>
            </div>
          </div>
        </div>
      </search>
    </>
  )
}
