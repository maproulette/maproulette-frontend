let editorWindow: Window | null = null

export const openEditorWindow = (url: string): void => {
  if (editorWindow && !editorWindow.closed) editorWindow.close()
  editorWindow = window.open(url, '_blank')
  if (editorWindow) editorWindow.opener = null
}
