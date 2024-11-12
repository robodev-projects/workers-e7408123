import { ModuleMetadata } from '@nestjs/common';

import { KVStoreModule } from '~common/kvstore';

import { AuthnSessionProvider } from './authn-session.provider';

export const AuthnSessionPlugin: ModuleMetadata = {
  imports: [KVStoreModule.forFeature('session')],
  providers: [AuthnSessionProvider],
  exports: [AuthnSessionProvider],
};
