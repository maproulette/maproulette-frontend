const KEYWORD_TYPE_MAP: Record<string, string> = {
  subway: 'transit',
  metro: 'transit',
  tram: 'transit',
  train: 'transit',
  rail: 'transit',
  railway: 'transit',
  station: 'transit',
  transit: 'transit',
  bus: 'transit',

  water: 'water',
  ocean: 'water',
  lake: 'water',
  river: 'water',
  pond: 'water',
  coast: 'water',
  beach: 'water',
  hydro: 'water',

  forest: 'forest',
  tree: 'forest',
  trees: 'forest',
  woods: 'forest',
  vegetation: 'forest',
  park: 'forest',

  road: 'road',
  highway: 'road',
  street: 'road',
  path: 'road',

  building: 'building',
  buildings: 'building',
  address: 'building',
  housing: 'building',

  bike: 'bike',
  bicycle: 'bike',
  cycling: 'bike',
  cycleway: 'bike',
}

export const TASK_TYPE_KEYS = ['transit', 'water', 'forest', 'road', 'building', 'bike'] as const
export type TaskTypeKey = (typeof TASK_TYPE_KEYS)[number]

export const isTaskTypeKey = (value: string): value is TaskTypeKey =>
  (TASK_TYPE_KEYS as readonly string[]).includes(value)

export const resolveTaskTypeFromTags = (tags: string[] | undefined): TaskTypeKey | null => {
  if (!tags || tags.length === 0) return null
  for (const raw of tags) {
    const key = raw.trim().toLowerCase()
    const mapped = KEYWORD_TYPE_MAP[key]
    if (mapped && isTaskTypeKey(mapped)) return mapped
  }
  return null
}

export const TASK_TYPE_SYMBOL_SVG: Record<TaskTypeKey, string> = {
  transit: `<g transform="translate(7.5 7.5) scale(0.5)" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="12" height="15" rx="2"/><path d="M6 11h12"/><circle cx="9" cy="14.5" r="0.6" fill="#0f172a" stroke="none"/><circle cx="15" cy="14.5" r="0.6" fill="#0f172a" stroke="none"/><path d="M9 18l-1.5 3"/><path d="M15 18l1.5 3"/></g>`,

  water: `<g transform="translate(7.5 7.5) scale(0.5)" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></g>`,

  forest: `<g transform="translate(7.5 7.5) scale(0.5)" fill="#0f172a" stroke="#0f172a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 6 9h3l-3 4h3l-3 4h12l-3-4h3l-3-4h3z"/><rect x="11" y="17" width="2" height="4" fill="#0f172a"/></g>`,

  road: `<g transform="translate(7.5 7.5) scale(0.5)" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22 9 4"/><path d="M19 22 15 4"/><path d="M12 7v2"/><path d="M12 12v2"/><path d="M12 17v2"/></g>`,

  building: `<g transform="translate(7.5 7.5) scale(0.5)" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M12 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/></g>`,

  bike: `<g transform="translate(7.5 7.5) scale(0.5)" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></g>`,
}
