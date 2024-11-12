import { Module } from '@nestjs/common';

import { AuthnModule } from '~common/authn';
import { MediaModule } from '~common/media';

import { MediaLibraryController } from './media-library.controller';

@Module({
  imports: [
    //
    AuthnModule.forRoot(),
    MediaModule.forRoot(),
  ],
  controllers: [MediaLibraryController],
})
export class MediaLibraryModule {}
