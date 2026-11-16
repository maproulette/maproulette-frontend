import type * as React from 'react'
import { useEffect, useRef } from 'react'
import { computeResizedWidth, computeTotalWidth } from './columnResizeUtils'

const addSpacerCell = (row: Element, tagName: 'th' | 'td') => {
  if (row.querySelector(`:scope > ${tagName}[data-resize-spacer]`)) return
  const spacer = document.createElement(tagName)
  spacer.setAttribute('data-resize-spacer', '')
  spacer.setAttribute('aria-hidden', 'true')
  spacer.style.padding = '0'
  spacer.style.border = '0'
  row.appendChild(spacer)
}

const ensureSpacerCells = (table: HTMLTableElement) => {
  const headRow = table.querySelector('thead > tr')
  if (headRow) addSpacerCell(headRow, 'th')
  table.querySelectorAll('tbody > tr, tfoot > tr').forEach((row) => {
    addSpacerCell(row, 'td')
  })
}

const syncTableMinWidth = (table: HTMLTableElement) => {
  const realThs = Array.from(
    table.querySelectorAll<HTMLTableCellElement>('thead > tr > th:not([data-resize-spacer])')
  )
  table.style.minWidth = `${computeTotalWidth(realThs.map((th) => th.offsetWidth))}px`
}

export function useColumnResize(thRef: React.RefObject<HTMLTableCellElement | null>) {
  const observerRef = useRef<MutationObserver | null>(null)

  useEffect(() => () => observerRef.current?.disconnect(), [])

  const watchForRowChanges = (table: HTMLTableElement) => {
    observerRef.current?.disconnect()
    const observer = new MutationObserver(() => ensureSpacerCells(table))
    observer.observe(table, { childList: true, subtree: true })
    observerRef.current = observer
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const th = thRef.current
    if (!th) return
    const table = th.closest('table')
    if (!table) return

    if (table.style.tableLayout !== 'fixed') {
      Array.from(table.querySelectorAll<HTMLTableCellElement>('thead > tr > th')).forEach(
        (other) => {
          other.style.width = `${other.offsetWidth}px`
        }
      )
      table.style.tableLayout = 'fixed'
      ensureSpacerCells(table)
      watchForRowChanges(table)
    }

    syncTableMinWidth(table)

    const startX = e.clientX
    const startWidth = th.offsetWidth

    const onMouseMove = (ev: MouseEvent) => {
      th.style.width = `${computeResizedWidth(startWidth, startX, ev.clientX)}px`
      syncTableMinWidth(table)
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  return { handleResizeMouseDown }
}
