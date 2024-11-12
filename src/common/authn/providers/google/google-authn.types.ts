export const GOOGLE_AUTHN_PROVIDER_NAME = 'google';

export interface IGoogleAuthorizationFlowTokenResponse {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
}

export interface IGoogleAuthorizationFlowInstructions {
  url: string;
}
