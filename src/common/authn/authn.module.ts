import { Module } from '@nestjs/common';

import { getConfigFactory } from '~common/config';
import { CoreConfig } from '~common/core';
import { deferComposableModule } from '~common/utils/nestjs';

import { AuthnTokenService } from './authn-token.service';
import { AuthnConfig } from './authn.config';
import { AuthnLoader } from './authn.loader';
import { AuthnService } from './authn.service';

@Module({})
export class AuthnModule {
  static forRoot = deferComposableModule({
    module: AuthnModule,
    global: true, // required for guards
    providers: [
      //
      getConfigFactory(CoreConfig),
      getConfigFactory(AuthnConfig),

      AuthnLoader,
      AuthnService,
      AuthnTokenService,
    ],
    exports: [
      //
      AuthnService,
      AuthnTokenService,
    ],
  });
}
