import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Mock } from 'node:test';
import { describe, it, beforeAll } from 'vitest';

import { LoggerModule } from '~common/logger';
import { makeUUID } from '~common/utils/short-uuid';

import { MediaProvider } from '../media-provider.abstract';
import { MediaLoader } from '../media.loader';
import { MediaModule } from '../media.module';
import { MediaService } from '../media.service';
import { NotImplementedMediaPersistorPlugin } from '../persistors/not-implemented';
import { MediaPersistorMock, MediaProviderMock } from './media.mock';

describe('MediaService', () => {
  let app: INestApplication;
  let mediaService: MediaService;
  let mediaProviderGetMeta: Mock<MediaProvider['getMeta']>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule, MediaModule.forRoot([NotImplementedMediaPersistorPlugin])],
    })
      .overrideProvider(MediaPersistorMock.provide)
      .useValue(MediaPersistorMock.useValue)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    mediaService = app.get(MediaService);
    app.get(MediaLoader).providers = {
      [MediaProviderMock.provider]: MediaProviderMock.useValue,
    };
    mediaProviderGetMeta = MediaProviderMock.useValue.getMeta;
  });

  it('should raw upload/fetch requests and return instructions', async ({ expect }) => {
    expect(
      await mediaService.createRawUploadRequest(
        {
          fileName: 'test.png',
          fileSize: 1000,
        },
        { method: 'put', provider: MediaProviderMock.provider },
      ),
    ).toEqual(expect.objectContaining({ method: 'put' }));

    expect(
      await mediaService.createRawFetchRequest(
        {
          key: '1',
        },
        {
          provider: 'mock-provider',
        },
      ),
    ).toEqual(expect.objectContaining({ url: expect.any(String) }));
  });

  it('should perform CRUD operations on persistor', async ({ expect }) => {
    expect(
      await mediaService.create({
        fileName: '',
        fileSize: 0,
        key: '',
        mimeType: '',
        resourceName: '',
        id: '1',
        provider: 'mock-provider',
        userId: makeUUID(),
      }),
    ).toEqual(expect.objectContaining({ id: '1' }));
    expect(
      await mediaService.update({ id: '1' }, { fileName: '', fileSize: 0, key: '', mimeType: '', resourceName: '' }),
    ).toEqual(expect.objectContaining({ id: '1' }));
    expect(await mediaService.list({ where: { id: 'mock-id' } })).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'mock-id' })]),
    );
    expect(await mediaService.find({ id: 'mock-id' })).toEqual(expect.objectContaining({ id: 'mock-id' }));
  });

  it('should create and validate media upload requests', async ({ expect }) => {
    expect(
      await mediaService.createMediaUploadRequest(
        {
          fileName: 'my-image.jpeg',
          fileSize: 500,
          resourceName: 'small-image',
          userId: makeUUID(),
        },
        {
          key: '1',
          method: 'put',
          constraints: {
            fileSize: 500,
            mimeTypes: ['image/jpeg'],
          },
          provider: MediaProviderMock.provider,
        },
      ),
    ).toEqual(expect.objectContaining({ method: 'put' }));
    expect(
      await mediaService.createMediaReplaceRequest(
        {
          id: '1',
          fileName: 'my-image.jpeg',
          fileSize: 500,
          resourceName: 'small-image',
          userId: makeUUID(),
        },
        {
          method: 'put',
          constraints: {
            fileSize: 500,
            mimeTypes: ['image/jpeg'],
          },
        },
      ),
    ).toEqual(expect.objectContaining({ method: 'put' }));
  });

  it('should create media fetch requests', async ({ expect }) => {
    expect(
      await mediaService.createMediaFetchRequest({
        id: '1',
      }),
    ).toEqual(expect.objectContaining({ url: expect.any(String) }));
  });

  it('should create media fetch requests in bulk', async ({ expect }) => {
    expect(
      await mediaService.applyMediaFetchRequests([{ media: { id: '1' } }, { mediaId: { id: '2' } }], 'media'),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ media: expect.objectContaining({ url: expect.any(String), id: '1' }) }),
      ]),
    );
  });

  it('should validate a uploaded media', async ({ expect }) => {
    mediaProviderGetMeta.mock.mockImplementationOnce(async () => ({ fileSize: 500, mimeType: 'image/jpeg' }));
    expect(
      await mediaService.validate(
        {
          id: '1',
        },
        'small-image',
        {
          id: '1',
          key: 'small-image/random-key',
          mimeType: 'image/jpeg',
          fileName: 'my-image.jpeg',
          fileSize: 500,
          resourceName: 'small-image',
          provider: 'mock-provider',
          userId: makeUUID(),
        },
      ),
    ).toEqual(
      expect.objectContaining({
        validated: true,
        uploaded: true,
      }),
    );
  });

  it('should associate a media', async ({ expect }) => {
    mediaProviderGetMeta.mock.mockImplementationOnce(async () => ({ fileSize: 500, mimeType: 'image/jpeg' }));
    expect(
      await mediaService.associate(
        {
          id: '1',
          key: 'small-image/random-key',
          mimeType: 'image/jpeg',
          fileName: 'my-image.jpeg',
          fileSize: 500,
          resourceName: 'small-image',
          provider: 'mock-provider',
        },
        {
          module: 'test',
          type: 'test',
          resourceId: '0000-0000-0000-0000',
          userId: makeUUID(),
        },
      ),
    ).toEqual(
      expect.objectContaining({
        module: 'test',
        type: 'test',
      }),
    );
  });
});
