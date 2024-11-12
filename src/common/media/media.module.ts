import { Module } from '@nestjs/common';

import { getConfigFactory } from '~common/config';
import { CoreConfig } from '~common/core';
import { MediaConfig } from '~common/media/media.config';
import { deferComposableModule } from '~common/utils/nestjs';

import { MediaLoader } from './media.loader';
import { MediaService } from './media.service';

@Module({})
export class MediaModule {
  static forRoot = deferComposableModule({
    module: MediaModule,
    providers: [MediaLoader, MediaService, getConfigFactory(MediaConfig), getConfigFactory(CoreConfig)],
    exports: [MediaService],
  });
}
