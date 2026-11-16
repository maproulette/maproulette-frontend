import { createContext, useContext } from 'react'

interface MapToggleContextType {
  showMap: boolean
  setShowMap: (show: boolean) => void
}

export const MapToggleContext = createContext<MapToggleContextType | undefined>(undefined)

export const useMapToggle = () => {
  const context = useContext(MapToggleContext)
  if (!context) {
    throw new Error('useMapToggle must be used within MapToggleContext')
  }
  return context
}
