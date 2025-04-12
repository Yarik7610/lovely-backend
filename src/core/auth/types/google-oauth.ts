export type GoogleUserInfo = {
  oauthId: string
  email: string
  name: string
}

export type GoogleUserResponse = {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
}

export type GoogleTokensResponse = {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope: string
  token_type: string
}
