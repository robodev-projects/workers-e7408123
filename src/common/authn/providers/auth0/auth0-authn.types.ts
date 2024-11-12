export const AUTH0_AUTHN_PROVIDER_NAME = 'auth0';

/**
 * https://auth0.com/docs/secure/tokens/id-tokens
 */
export interface Auth0AuthorizationFlowToken {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: string;
}

export interface Auth0AuthorizationFlowInstructions {
  url: string;
}
