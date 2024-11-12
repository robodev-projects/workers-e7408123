import { type ModuleMetadata } from '@nestjs/common';

import { getConfig, getConfigFactory } from '~common/config';

import { Auth0AuthnAuthorizationFlowController } from './auth0-authn-authorization-flow.controller';
import { Auth0AuthnConfig } from './auth0-authn.config';
import { Auth0AuthnProvider } from './auth0-authn.provider';

const auth0AuthnConfig = getConfig(Auth0AuthnConfig);

export const Auth0AuthnPlugin: ModuleMetadata = {
  providers: [
    //
    getConfigFactory(Auth0AuthnConfig),
    Auth0AuthnProvider,
  ],
  exports: [Auth0AuthnProvider],
  controllers: auth0AuthnConfig.authorizationFlowEnabled ? [Auth0AuthnAuthorizationFlowController] : [],
};
