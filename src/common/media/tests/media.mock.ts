import type { ValueProvider } from '@nestjs/common/interfaces/modules/provider.interface';
import { mock } from 'node:test';

import { MediaPersistor } from '../media-persistor.abstract';
import { MediaProvider } from '../media-provider.abstract';
import { MediaService } from '../media.service';
import { type IMedia, IMediaFetchInstructions, IMediaUploadInstructions } from '../media.types';

const exampleMediaBlob = Buffer.from(
  new Uint8Array(
    atob(
      'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAIklEQVQI12N4raiHFTEA8f8PWmgIIYFTB2GjiNaBXQIrAgC1H1qz4fywJQAAAABJRU5ErkJggg==',
    )
      .split('')
      .map((c) => c.charCodeAt(0)),
  ),
);

export const exampleMedia: IMedia = {
  id: 'mock-id',
  key: 'mock-key',
  resourceName: 'mock-resource-name',
  fileName: 'mock-file-name.png',
  fileSize: exampleMediaBlob.length,
  mimeType: 'image/png',
  provider: 'mock-provider',
};

/**
 * Mock all calls to MediaService
 */
export const MediaServiceMock: ValueProvider = {
  provide: MediaService,
  useValue: {
    get: mock.fn(() => {
      return exampleMedia;
    }),
    // todo
  },
};

/**
 * Mock calls to Media Providers
 */
export const MediaProviderMock: ValueProvider & { provider: string } = {
  provider: exampleMedia.provider,
  provide: MediaProvider,
  useValue: {
    getMeta: mock.fn(() => {
      return { fileSize: exampleMedia.fileSize, mimeType: exampleMedia.mimeType };
    }),
    createUploadRequest: mock.fn((file: any, options: { key: string; method: any }) => {
      switch (options.method) {
        case 'post':
          return {
            method: options.method,
            url: 'http://localhost:8080/upload',
            fields: [['key', 'mock-key']],
            provider: 'mock-provider',
            id: 'mock-id',
          } satisfies IMediaUploadInstructions;
        case 'put':
        default:
          return {
            method: options.method,
            url: 'http://localhost:8080/upload',
            provider: 'mock-provider',
            id: 'mock-id',
          } satisfies IMediaUploadInstructions;
      }
    }),
    createFetchRequest: mock.fn(() => {
      return {
        url: 'http://localhost:8080/upload',
      } satisfies IMediaFetchInstructions;
    }),
  },
};

/**
 * Mock calls to Media Persistor
 */
export const MediaPersistorMock: ValueProvider = {
  provide: MediaPersistor,
  useValue: {
    find: mock.fn(() => {
      return exampleMedia;
    }),
    list: mock.fn((options?: { where: { id: string | string[]; key: string | string[] } }) => {
      let items = [exampleMedia];
      if (Array.isArray(options?.where.id)) {
        items = options?.where.id.map((id) => ({ ...exampleMedia, id }));
      }
      if (Array.isArray(options?.where.key)) {
        items = options?.where.key.map((key) => ({ ...exampleMedia, key }));
      }
      return items;
    }),
    create: mock.fn((a) => {
      return a;
    }),
    update: mock.fn((a, b) => {
      return { ...exampleMedia, ...a, ...b };
    }),
  },
};
