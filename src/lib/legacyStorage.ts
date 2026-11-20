// TODO: delete this once it has been live for a couple of releases
export const migrateLegacyStorage = () => {
  try {
    const theme = localStorage.getItem('app-theme')
    if (theme !== null) localStorage.setItem('mr.theme', JSON.stringify(theme))
    const locale = localStorage.getItem('mr4:locale')
    if (locale !== null) localStorage.setItem('mr.locale', JSON.stringify(locale))
    const layers = localStorage.getItem('mr4:map:customBaseLayers')
    if (layers !== null) localStorage.setItem('mr.map.customBaseLayers', layers)

    for (const key of [
      'app-theme',
      'mr4:locale',
      'mr4:map:customBaseLayers',
      'mapstyle',
      'map.showDirections',
      'map.showOtherChallenges',
      'mr4:idEditor:controlsPosition',
    ]) {
      localStorage.removeItem(key)
    }
  } catch {
    // Storage is blocked, so there's nothing to migrate.
  }
  document.cookie = 'mr4_explore_challenges_filters=; max-age=0; path=/'
}
