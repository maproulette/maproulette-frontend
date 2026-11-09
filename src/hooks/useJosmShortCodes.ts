import { useMemo } from 'react'
import { defineMessage } from 'react-intl'
import { toast } from 'sonner'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { EDITOR, isJosmEditor } from '@/lib/editors'
import {
  josmLoadObjectsUrl,
  josmZoomUrl,
  sendJosmCommand,
  viewportToBbox,
} from '@/lib/josmRemoteControl'
import type { OsmElementsToken } from '@/lib/shortCodes'

type OsmElement = OsmElementsToken['elements'][number]

export const josmNoResponseMessage = defineMessage({
  id: 'taskEditPage.taskActions.editorButton.josmNoResponse',
  defaultMessage:
    'OSM remote control did not respond. Do you have JOSM running with Remote Control enabled?',
})

interface JosmShortCodes {
  loadElements: (elements: OsmElement[]) => void
  zoomToViewport: (zoom: string, lat: string, lon: string) => void
}

export const useJosmShortCodes = (): JosmShortCodes | null => {
  const { t } = useIntl()
  const { user } = useAuthContext()
  const editor = user?.settings?.defaultEditor

  return useMemo(() => {
    if (!isJosmEditor(editor)) return null

    const send = (url: string) => {
      void sendJosmCommand(url).then((ok) => {
        if (!ok) {
          toast.error(t(josmNoResponseMessage))
        }
      })
    }

    return {
      loadElements: (elements) =>
        send(
          josmLoadObjectsUrl(
            elements.map((element) => `${element.type[0]}${element.id}`),
            editor === EDITOR.josmLayer
          )
        ),
      zoomToViewport: (zoom, lat, lon) =>
        send(
          josmZoomUrl(
            viewportToBbox(
              Number(zoom),
              Number(lat),
              Number(lon),
              window.innerWidth,
              window.innerHeight
            )
          )
        ),
    }
  }, [editor, t])
}
