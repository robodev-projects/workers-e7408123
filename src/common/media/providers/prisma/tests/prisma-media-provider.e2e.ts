import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, it } from 'vitest';

import { LoggerModule } from '~common/logger';
import { makeId } from '~common/utils/short-uuid';

import { PrismaService } from '~database/prisma';
import { PrismaEphemeralModule } from '~database/prisma/prisma.ephemeral.module';

import { requestPipes } from '~app.pipes';
import { createBaseTestingModule } from '~test/utils';

import { MediaModule } from '../../../media.module';
import { PrismaMediaPersistorPlugin } from '../../../persistors/prisma';
import { PRISMA_MEDIA_PROVIDER_NAME } from '../../../providers/prisma/prisma-media.provider.types';
import { MediaFixture } from '../../../tests/media.fixture';
import { PrismaMediaProvider } from '../prisma-media.provider';
import { PrismaMediaProviderPlugin } from '../prisma-media.provider.plugin';

const pngImage = {
  data: new Uint8Array(
    atob(
      'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAIklEQVQI12N4raiHFTEA8f8PWmgIIYFTB2GjiNaBXQIrAgC1H1qz4fywJQAAAABJRU5ErkJggg==',
    )
      .split('')
      .map((c) => c.charCodeAt(0)),
  ),
  mimeType: 'image/png',
  fileName: 'image.png',
};

describe('Prisma MediaService', () => {
  let app: INestApplication;

  let prismaMediaProvider: PrismaMediaProvider;
  let prismaService: PrismaService;

  beforeAll(async () => {
    app = await createBaseTestingModule(
      {
        imports: [
          LoggerModule,
          PrismaEphemeralModule,
          MediaModule.forRoot([PrismaMediaProviderPlugin, PrismaMediaPersistorPlugin]),
        ],
      },
      {
        beforeInit: (app) => {
          requestPipes(app);
          return app;
        },
      },
    );

    prismaService = app.get(PrismaService);
    prismaMediaProvider = app.get(PrismaMediaProvider);
  });

  it('should upload using post then download the same file', async ({ expect }) => {
    const key = `media/${makeId()}`;

    const media = await MediaFixture.fromPartial(
      {
        key,
        resourceName: `media/${makeId()}`,
        fileName: pngImage.fileName,
        mimeType: pngImage.mimeType,
        fileSize: pngImage.data.length,
        provider: PRISMA_MEDIA_PROVIDER_NAME,
      },
      prismaService.client,
    );

    const uploadInstructions = await prismaMediaProvider.createUploadRequest(
      {
        mimeType: media.entity.mimeType,
        fileName: media.entity.fileName,
        fileSize: media.entity.fileSize,
      },
      {
        key: media.entity.key,
        method: 'post',
      },
    );
    expect(uploadInstructions).toEqual(expect.objectContaining({ method: 'post', url: expect.any(String) }));

    let uploadRequest = request(app.getHttpServer()).post(uploadInstructions.url!.replace(/^.*?\/media/, '/media'));

    for (const [k, v] of uploadInstructions.fields || []) {
      uploadRequest = uploadRequest.field(k, v);
    }

    uploadRequest = uploadRequest.attach('file', Buffer.alloc(pngImage.data.length, pngImage.data), {
      contentType: pngImage.mimeType,
      filename: pngImage.fileName,
    });

    await uploadRequest.expect(HttpStatus.CREATED);

    // download the image, expect it to be the same
    const fetchInstructions = await prismaMediaProvider.createFetchRequest(
      { key },
      { providerOptions: { signFetch: true } },
    );

    expect(fetchInstructions).toEqual(expect.objectContaining({ url: expect.stringContaining(key) }));

    await request(app.getHttpServer())
      .get(fetchInstructions.url!.replace(/^.+?\/media/, '/media'))
      .send()
      .expect(HttpStatus.OK)
      .expect('Content-Type', pngImage.mimeType)
      .expect('Content-Length', pngImage.data.length.toString())
      .expect('Content-Disposition', `attachment; filename="${pngImage.fileName}"`);
  });
});
