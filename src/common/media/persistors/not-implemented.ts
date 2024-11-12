import { type ModuleMetadata } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

import { MediaPersistor } from '../media-persistor.abstract';
import type { IMedia } from '../media.types';

@Injectable()
export class NotImplementedMediaPersistor implements MediaPersistor {
  async find(): Promise<IMedia> {
    throw new Error('Method not implemented');
  }
  async list(): Promise<IMedia[]> {
    throw new Error('Method not implemented');
  }
  async create(): Promise<IMedia> {
    throw new Error('Method not implemented');
  }
  async update(): Promise<IMedia> {
    throw new Error('Method not implemented');
  }
}

export const NotImplementedMediaPersistorPlugin: ModuleMetadata = {
  providers: [{ provide: MediaPersistor, useClass: NotImplementedMediaPersistor }],
  exports: [MediaPersistor],
};
