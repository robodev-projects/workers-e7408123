import { Module } from '@nestjs/common';

import { AuthnModule } from '~common/authn';

import { UserRepository } from '../user.repository';
import { UserService } from '../user.service';
import { UserSessionController } from './user-session.controller';
import { UserSessionService } from './user-session.service';

@Module({
  imports: [AuthnModule.forRoot()],
  controllers: [UserSessionController],
  providers: [UserSessionService, UserService, UserRepository],
  exports: [UserSessionService],
})
export class UserSessionModule {}
