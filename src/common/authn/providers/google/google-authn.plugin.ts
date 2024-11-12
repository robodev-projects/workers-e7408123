import { type ModuleMetadata } from '@nestjs/common';

import { getConfig, getConfigFactory } from '~common/config';

import { GoogleAuthnAuthorizationFlowController } from './google-authn-authorization-flow.controller';
import { GoogleAuthnConfig } from './google-authn.config';
import { GoogleAuthnProvider } from './google-authn.provider';

const googleAuthnConfig = getConfig(GoogleAuthnConfig);

export const GoogleAuthnPlugin: ModuleMetadata = {
  providers: [
    //
    getConfigFactory(GoogleAuthnConfig),
    GoogleAuthnProvider,
  ],
  exports: [GoogleAuthnProvider],
  controllers: googleAuthnConfig.authorizationFlowEnabled ? [GoogleAuthnAuthorizationFlowController] : [],
};
