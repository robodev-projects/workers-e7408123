import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, beforeAll, it } from 'vitest';

import { getConfig } from '~common/config';
import { LoggerModule } from '~common/logger';
import { makeId } from '~common/utils/short-uuid';

import { MediaModule } from '../../../media.module';
import { NotImplementedMediaPersistorPlugin } from '../../../persistors/not-implemented';
import { AwsS3MediaConfig } from '../aws-s3-media.config';
import { AwsS3MediaPlugin } from '../aws-s3-media.plugin';
import { AwsS3MediaProvider } from '../aws-s3-media.provider';

const awsS3MediaConfig = getConfig(AwsS3MediaConfig);

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

describe('AWS S3 MediaService', { skip: !awsS3MediaConfig.apiEndpoint }, () => {
  let app: INestApplication;

  let mediaProvider: AwsS3MediaProvider;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule, MediaModule.forRoot([AwsS3MediaPlugin, NotImplementedMediaPersistorPlugin])],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    mediaProvider = app.get(AwsS3MediaProvider);
  });

  async function download(key: string, expect: (...a: any) => any) {
    const fetchInstructions = await mediaProvider.createFetchRequest(
      { key },
      {
        providerOptions: {
          signFetch: 's3',
          bucket: 'media',
        },
      },
    );
    const fetchResponse = await fetch(fetchInstructions.url!);
    expect(fetchResponse.status).toBe(200);
    expect(fetchResponse.headers.get('content-type')).toBe(pngImage.mimeType);
    expect(fetchResponse.headers.get('content-length')).toBe(pngImage.data.length.toString());
  }

  it('should upload using post', async ({ expect }) => {
    const key = `small-image/${makeId()}`;
    const uploadInstructions = await mediaProvider.createUploadRequest(
      {
        mimeType: pngImage.mimeType,
        fileName: pngImage.fileName,
        fileSize: pngImage.data.length,
      },
      {
        key,
        method: 'post',
      },
    );
    expect(uploadInstructions).toEqual(expect.objectContaining({ method: 'post' }));

    // upload image to provider
    try {
      const formData = new FormData();
      if (uploadInstructions.fields) {
        for (const [k, v] of uploadInstructions.fields) {
          formData.append(k, v);
        }
      }
      formData.append('file', new Blob([pngImage.data], { type: pngImage.mimeType }), pngImage.fileName);
      const response = await fetch(uploadInstructions.url!, {
        method: 'POST',
        body: formData,
      });
      if (response.status !== 204) {
        //console.log(await response.text());
        //console.log({ formData });
        //console.log({ response });
        throw new Error(`Error uploading to presigned post`);
      }
    } catch (error) {
      throw new Error(`Error uploading to presigned post`, { cause: error });
    }

    // download the image, expect it to be the same
    await download(key, expect);
  });

  it('should upload using put', async ({ expect }) => {
    const key = `small-image/${makeId()}`;
    const uploadInstructions = await mediaProvider.createUploadRequest(
      {
        mimeType: pngImage.mimeType,
        fileName: pngImage.fileName,
        fileSize: pngImage.data.length,
      },
      {
        key,
        method: 'put',
      },
    );
    expect(uploadInstructions).toEqual(expect.objectContaining({ method: 'put' }));

    // upload image using put and fetch
    const uploadResponse = await fetch(uploadInstructions.url!, {
      method: 'PUT',
      body: new Blob([pngImage.data], { type: pngImage.mimeType }),
    });
    expect(uploadResponse.status).toBe(200);

    // download the image, expect it to be the same
    await download(key, expect);
  });
});
