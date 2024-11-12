import { Module } from '@nestjs/common';

import { MediaModule } from '~common/media';

import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [
    //
    MediaModule.forRoot(),
  ],
  providers: [
    //
    UserRepository,
    UserService,
  ],
  exports: [
    //
    UserService,
  ],
})
export class UserModule {}
