import { BadRequestException, Injectable } from "@nestjs/common"
import { GOOGLE_AUTH_CONFIG } from "../configs"
import { GoogleTokensResponse, GoogleUserInfo, GoogleUserResponse } from "../types"

@Injectable()
export class GoogleOAuthService {
  private async exchangeCodeForTokens(code: string): Promise<{
    accessToken: GoogleTokensResponse["access_token"]
    refreshToken?: GoogleTokensResponse["refresh_token"]
  }> {
    const GOOGLE_TOKENS_URL = "https://oauth2.googleapis.com/token"
    const { client_id, client_secret, redirect_uri } = GOOGLE_AUTH_CONFIG

    try {
      const response = await fetch(GOOGLE_TOKENS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          code,
          client_id,
          client_secret,
          redirect_uri,
          grant_type: "authorization_code"
        }).toString()
      })

      if (!response.ok) throw new BadRequestException(`Failed to fetch google user info`)

      const { access_token, refresh_token } = (await response.json()) as GoogleTokensResponse

      return { accessToken: access_token, refreshToken: refresh_token }
    } catch {
      throw new BadRequestException(`Failed to exchange code for tokens`)
    }
  }

  private async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

    try {
      const response = await fetch(GOOGLE_USERINFO_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!response.ok) throw new Error()

      const { id, email, name } = (await response.json()) as GoogleUserResponse

      if (!id || !email) throw new BadRequestException(`Incomplete user data received from Google`)

      return {
        oauthId: id,
        email,
        name
      }
    } catch {
      throw new BadRequestException(`Failed to fetch google user info`)
    }
  }

  getGoogleAuthUrl() {
    const GOOGLE_AUTH_ROUTE = "https://accounts.google.com/o/oauth2/v2/auth"

    const { client_id, redirect_uri } = GOOGLE_AUTH_CONFIG

    const dataToRetrieve = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ]

    const options = {
      redirect_uri,
      client_id,
      response_type: "code",
      access_type: "offline",
      //TODO: always returns refresh_token, remove on prod
      prompt: "consent",
      scope: dataToRetrieve.join(" ")
    }

    const optionsQueryString = Object.entries(options)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&")

    return { googleAuthUrl: `${GOOGLE_AUTH_ROUTE}?${optionsQueryString}` }
  }

  async handleGoogleCallback(code: string | undefined) {
    if (!code) throw new BadRequestException("Didn't provide query string code param")

    const { accessToken, refreshToken } = await this.exchangeCodeForTokens(code)

    const userInfo = await this.getGoogleUserInfo(accessToken)

    return {
      ...userInfo,
      accessToken,
      refreshToken
    }
  }
}
