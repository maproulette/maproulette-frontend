import { notFound } from '@tanstack/react-router'

export const requireIds = (params: Record<string, string>) => {
  if (!Object.values(params).every((value) => /^\d+$/.test(value))) throw notFound()
}
