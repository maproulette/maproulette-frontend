import { nominatim } from './nominatim'
import { osm } from './osm'

export const api = {
  osm,
  nominatim,
}

// Re-exported for backward compatibility. Feature modules under src/api/**
// must import these from './client' (or '../client'), not from here or from
// '@/api' — importing from this file creates a circular dependency (this
// file imports every feature module to build `api` above), which can leave
// an aggregator like challenge/index.ts's spread-merge silently missing a
// submodule's exports depending on module load order.
export { apiRequest, convertParamsToSearchParams } from './client'
