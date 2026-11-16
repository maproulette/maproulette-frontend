export type OAuthCallbackResponse = {
  token: string
}

export interface OAuthLoginResponse {
  state: string
  redirect: string
}
