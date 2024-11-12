import { MiddlewareConsumer, Module } from '@nestjs/common';

import { AuthnMiddleware, AuthnModule } from '~common/authn';
import { MediaModule } from '~common/media';

import { UserRepository } from '~modules/user/user.repository';

import { UserService } from '../user.service';
import { UserAccountController } from './user-account.controller';
import { UserAccountService } from './user-account.service';

@Module({
  imports: [
    //
    AuthnModule.forRoot(),
    MediaModule.forRoot(),
  ],

  controllers: [
    //
    UserAccountController,
  ],
  providers: [
    //
    UserAccountService,

    UserRepository,
    UserService,
  ],
  exports: [
    //
    UserAccountService,
  ],
})
export class UserAccountModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthnMiddleware()).forRoutes('*');
  }
}
