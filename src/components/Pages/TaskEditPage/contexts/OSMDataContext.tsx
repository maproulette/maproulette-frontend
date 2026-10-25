import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { createContext, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { useTaskMapContext } from './TaskMapContext'

export interface OSMDataContextType {
  showOSMData: boolean
  setShowOSMData: Dispatch<SetStateAction<boolean>>
  osmData: Document | null
  setOsmData: Dispatch<SetStateAction<Document | null>>
  osmDataLoading: boolean
  showOSMElements: {
    nodes: boolean
    ways: boolean
    areas: boolean
  }
  setShowOSMElements: Dispatch<
    SetStateAction<{
      nodes: boolean
      ways: boolean
      areas: boolean
    }>
  >
  osmElementOrder: ('nodes' | 'ways' | 'areas')[]
  setOsmElementOrder: Dispatch<SetStateAction<('nodes' | 'ways' | 'areas')[]>>
  dataLayerOrder: ('task-features' | 'osm-data')[]
  setDataLayerOrder: Dispatch<SetStateAction<('task-features' | 'osm-data')[]>>
  showTaskFeatures: boolean
  setShowTaskFeatures: Dispatch<SetStateAction<boolean>>
  fetchOSMDataForBounds: () => Promise<void>
  handleToggleOSMData: () => Promise<void>
  handleToggleOSMElement: (element: 'nodes' | 'ways' | 'areas') => void
}

const OSMDataContext = createContext<OSMDataContextType | undefined>(undefined)

export const OSMDataProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useIntl()
  const { map, mapLoaded } = useTaskMapContext()
  const [showOSMData, setShowOSMData] = useState(false)
  const [osmData, setOsmData] = useState<Document | null>(null)
  const [osmDataLoading, setOsmDataLoading] = useState(false)
  const [showOSMElements, setShowOSMElements] = useState({
    nodes: true,
    ways: true,
    areas: true,
  })
  const [osmElementOrder, setOsmElementOrder] = useState<('nodes' | 'ways' | 'areas')[]>([
    'ways',
    'areas',
    'nodes',
  ])
  const [dataLayerOrder, setDataLayerOrder] = useState<('task-features' | 'osm-data')[]>([
    'task-features',
    'osm-data',
  ])
  const [showTaskFeatures, setShowTaskFeatures] = useState(true)

  // Reason: stable references returned from context — consumers use these as event handler dependencies
  const fetchOSMDataForBounds = useCallback(async () => {
    if (!map.current || !mapLoaded) return

    setOsmDataLoading(true)
    try {
      const maplibreMap = map.current.getMap()
      const bounds = maplibreMap.getBounds()
      const bbox = api.osm.getBBoxString(bounds)
      const xmlData = await api.osm.fetchOSMData(bbox)
      setOsmData(xmlData)
    } catch (error) {
      logger.error('Error fetching OSM data', { error })

      const errorMessage =
        error instanceof Error
          ? error.message
          : t('taskEditPage.osmData.fetchError', undefined, 'Failed to fetch OSM data')
      if (errorMessage.includes('too large')) {
        throw error
      } else {
        throw new Error(
          t(
            'taskEditPage.osmData.fetchErrorRetry',
            undefined,
            'Failed to fetch OSM data. Please try again.'
          )
        )
      }
    } finally {
      setOsmDataLoading(false)
    }
  }, [map, mapLoaded])

  const handleToggleOSMData = useCallback(async () => {
    const shouldLoad = !showOSMData

    if (shouldLoad) {
      try {
        await fetchOSMDataForBounds()
        setShowOSMData(true)
        toast.success(
          t('taskEditPage.osmData.loadSuccess', undefined, 'OSM data loaded successfully')
        )
      } catch (error) {
        setShowOSMData(false)
        const errorMessage =
          error instanceof Error
            ? error.message
            : t('taskEditPage.osmData.fetchError', undefined, 'Failed to fetch OSM data')
        if (errorMessage.includes('too large')) {
          toast.error(t('taskEditPage.osmData.areaTooLarge', undefined, 'Area too large'), {
            description: t(
              'taskEditPage.osmData.areaTooLargeDescription',
              undefined,
              'Please zoom in further to view OSM features. The selected area exceeds the maximum allowed size.'
            ),
          })
        } else {
          toast.error(t('taskEditPage.osmData.fetchError', undefined, 'Failed to fetch OSM data'), {
            description: errorMessage,
          })
        }
      }
    } else {
      setOsmData(null)
      setShowOSMData(false)
    }
  }, [showOSMData, fetchOSMDataForBounds])

  const handleToggleOSMElement = useCallback((element: 'nodes' | 'ways' | 'areas') => {
    setShowOSMElements((prev) => ({
      ...prev,
      [element]: !prev[element],
    }))
  }, [])

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value: OSMDataContextType = useMemo(
    () => ({
      showOSMData,
      setShowOSMData,
      osmData,
      setOsmData,
      osmDataLoading,
      showOSMElements,
      setShowOSMElements,
      osmElementOrder,
      setOsmElementOrder,
      dataLayerOrder,
      setDataLayerOrder,
      showTaskFeatures,
      setShowTaskFeatures,
      fetchOSMDataForBounds,
      handleToggleOSMData,
      handleToggleOSMElement,
    }),
    [
      showOSMData,
      osmData,
      osmDataLoading,
      showOSMElements,
      osmElementOrder,
      dataLayerOrder,
      showTaskFeatures,
      fetchOSMDataForBounds,
      handleToggleOSMData,
      handleToggleOSMElement,
    ]
  )

  return <OSMDataContext.Provider value={value}>{children}</OSMDataContext.Provider>
}
