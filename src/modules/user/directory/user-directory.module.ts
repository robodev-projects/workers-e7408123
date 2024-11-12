import { Module } from '@nestjs/common';

import { UserModule } from '../user.module';
import { UserDirectoryController } from './user-directory.controller';

@Module({
  imports: [UserModule],
  controllers: [
    //
    UserDirectoryController,
  ],
})
export class UserDirectoryModule {}
