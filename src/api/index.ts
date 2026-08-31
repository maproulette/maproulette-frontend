import { challenge } from './challenge'
import { osm } from './osm'
import { project } from './project'
import { search } from './search'
import { service } from './service'
import { task } from './task'
import { taskBundle } from './taskBundle'
import { team } from './team'
import { teamImage } from './teamImage'
import { user } from './user'

export const api = {
  challenge,
  task,
  taskBundle,
  user,
  project,
  osm,
  search,
  service,
  team,
  teamImage,
}

// Re-exported for backward compatibility. Feature modules under src/api/**
// must import these from './client' (or '../client'), not from here or from
// '@/api' — importing from this file creates a circular dependency (this
// file imports every feature module to build `api` above), which can leave
// an aggregator like challenge/index.ts's spread-merge silently missing a
// submodule's exports depending on module load order.
export { apiKey, apiRequest, convertParamsToSearchParams } from './client'
