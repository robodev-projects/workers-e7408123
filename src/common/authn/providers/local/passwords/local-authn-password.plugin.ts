import { ModuleMetadata } from '@nestjs/common';

import { LocalAuthnConfig } from '~common/authn/providers/local/local-authn.config';
import { getConfig } from '~common/config';

import { LocalAuthnPasswordRegistrationController } from './local-authn-password-registration.controller';
import { LocalAuthnPasswordController } from './local-authn-password.controller';
import { LocalAuthnPasswordService } from './local-authn-password.service';

const localAuthnConfig = getConfig(LocalAuthnConfig);

export const LocalAuthnPasswordPlugin: ModuleMetadata = {
  providers: [LocalAuthnPasswordService],
  controllers: [
    LocalAuthnPasswordController,
    ...(localAuthnConfig.passwords?.registration ? [LocalAuthnPasswordRegistrationController] : []),
  ],
};
