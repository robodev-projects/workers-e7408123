import { getConfig, getConfigFactory } from '~common/config';

import { LocalAuthnPersistor } from './local-authn-persistor.abstract';
import { LocalAuthnRefreshTokenController } from './local-authn-refresh-token.controller';
import { LocalAuthnConfig } from './local-authn.config';
import { LocalAuthnProvider } from './local-authn.provider';
import { LocalAuthnService } from './local-authn.service';

const localAuthnConfig = getConfig(LocalAuthnConfig);

export const LocalAuthnPlugin = {
  providers: [getConfigFactory(LocalAuthnConfig), LocalAuthnProvider, LocalAuthnService],
  exports: [LocalAuthnPersistor, LocalAuthnProvider, LocalAuthnService],
  controllers: localAuthnConfig.refreshToken ? [LocalAuthnRefreshTokenController] : [],
};
