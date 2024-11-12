import { GetObjectCommand, PutObjectCommand, S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as getCloudfrontSignedUrl } from '@aws-sdk/cloudfront-signer';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { Conditions } from '@aws-sdk/s3-presigned-post/dist-types/types';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, OnModuleInit } from '@nestjs/common';

import type { MediaProvider } from '../../media-provider.abstract';
import { MediaProviderError } from '../../media.exceptions';
import { MediaLoader } from '../../media.loader';
import type {
  IMediaConstraints,
  IMediaFetchInstructions,
  IMediaFile,
  IMediaUploadInstructions,
} from '../../media.types';
import { AwsS3MediaConfig } from './aws-s3-media.config';
import {
  AWS_S3_MEDIA_PROVIDER_NAME,
  IAwsS3MediaProviderFetchOptions,
  IAwsS3MediaProviderRequestOptions,
} from './aws-s3-media.types';

@Injectable()
export class AwsS3MediaProvider implements MediaProvider, OnModuleInit {
  private readonly client: S3Client;

  constructor(
    private readonly config: AwsS3MediaConfig,
    private readonly mediaLoader: MediaLoader,
  ) {
    this.client = new S3Client({
      region: config.region,
      credentials:
        config.accessKeyId && config.secretAccessKey
          ? {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            }
          : undefined,
      endpoint: config.apiEndpoint,
      forcePathStyle: !!config.apiEndpoint,
    });
  }

  onModuleInit() {
    this.mediaLoader.registerProvider(AWS_S3_MEDIA_PROVIDER_NAME, this);
  }

  /**
   * Return the object metadata
   */
  async getMeta(
    key: string,
    options?: {
      providerOptions?: {
        bucket?: string;
      };
    },
  ): Promise<{ fileSize?: number; mimeType?: string }> {
    const bucket = options?.providerOptions?.bucket || this.config.bucket;

    const meta: {
      mimeType?: string;
      fileSize?: number;
    } = {};

    try {
      /**
       * Get S3 object metadata
       *  - also checks if it exists
       */
      const objectHead = await this.client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
      meta.mimeType = objectHead.ContentType;
      meta.fileSize = objectHead.ContentLength;
    } catch (error) {
      throw new MediaProviderError(`Error getting object metadata`, {
        code: 'media-provider-no-object-metadata',
        cause: error,
      });
    }

    try {
      const s3Tokenizer = await (
        await import('@tokenizer/s3')
      ).makeTokenizer(this.client, {
        Bucket: bucket,
        Key: key,
      });

      const response = await (await import('file-type')).fileTypeFromTokenizer(s3Tokenizer);
      if (response) {
        meta.mimeType = response.mime;
      }
    } catch (error) {
      throw new MediaProviderError(`Error getting mimetype`, {
        code: 'media-provider-mimetype-error',
        cause: error,
      });
    }

    return meta;
  }

  public async createUploadRequest(
    file: IMediaFile,
    options: {
      // file key
      key: string;

      // suggested upload method
      method?: string;

      // arbitrary options for the provider
      providerOptions?: IAwsS3MediaProviderRequestOptions;

      constraints?: IMediaConstraints;
    },
  ): Promise<Omit<IMediaUploadInstructions, 'id'>> {
    const bucket = options?.providerOptions?.bucket || this.config.bucket;
    const key = this.config?.prefix ? `${this.config?.prefix}${options.key}` : options.key;
    const expiresIn = options?.providerOptions?.expiresIn || 60 * 15;
    const mimeType = file.mimeType;
    const fileSize = file.fileSize;

    const method = options.method || this.config.uploadMethods[0];
    if (!this.config.uploadMethods.includes(method)) {
      throw new MediaProviderError(`Invalid upload method: '${method}'`, {
        code: 'media-provider-invalid-upload-method',
      });
    }

    switch (method) {
      case 'post': {
        /**
         * @see https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-HTTPPOSTConstructPolicy.html
         * @see https://zaccharles.medium.com/s3-uploads-proxies-vs-presigned-urls-vs-presigned-posts-9661e2b37932
         *
         *  - limit is 5GB, but uploads can not be resumed
         */
        const conditions: Conditions[] = [{ bucket }];

        conditions.push(['content-length-range', 0, fileSize]);
        conditions.push(['eq', 'content-type', mimeType]);

        const result = await createPresignedPost(this.client, {
          Bucket: bucket,
          Key: key,
          Conditions: conditions,
          Expires: expiresIn,
        });

        return {
          method: 'post',
          url: result.url,
          // key order is important
          fields: [...Object.entries(result.fields), ['content-type', mimeType]],
          provider: AWS_S3_MEDIA_PROVIDER_NAME,
        };
      }
      case 'put': {
        /**
         *  - limit is 5GB, but uploads can not be resumed
         */
        try {
          return {
            method: 'put',
            url: await getS3SignedUrl(
              this.client,
              new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                // Do not allow overwriting if object already exists
                //  Only works with PUT
                IfNoneMatch: '*',
                ContentType: mimeType,
                ContentLength: fileSize,
              }),
              { expiresIn },
            ),
            provider: AWS_S3_MEDIA_PROVIDER_NAME,
          };
        } catch (error) {
          throw new MediaProviderError(`Error generating presigned URL`, {
            code: 'media-provider-error-generating-presigned-url',
            cause: error,
          });
        }
      }
      case 'multipart': {
        throw new MediaProviderError(`Multipart upload not implemented`, {
          code: 'media-provider-multipart-not-implemented',
        });

        /**
         * Multipart upload for large files
         *  - needs a custom client for s3, we use uppy as an example
         *  - we hand off this to a separate controller that handles the multipart upload
         *     outside the regular application lifecycle
         *  - alternatives include tus.io
         *
         *  - limit is up to the full 5TB
         *  - upload size can not be limited by the server
         *
         *  @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/command/CreateMultipartUploadCommand/
         *
         */

        //return {
        //  method: 'multipart',
        //  url: `/media/provider/s3/multipart/?key=${key}&uploadId=${uploadCommandResult.UploadId}`,
        //};
      }
      default:
        throw new MediaProviderError(`Invalid upload method: '${options?.method}'`, {
          code: 'media-provider-invalid-upload-method',
        });
    }
  }

  public async createFetchRequest(
    data: { key: string },
    options?: {
      // arbitrary options for the provider
      providerOptions?: IAwsS3MediaProviderFetchOptions;
    },
  ): Promise<Omit<IMediaFetchInstructions, 'id'>> {
    const bucket = options?.providerOptions?.bucket || this.config.bucket;
    const expiresIn = options?.providerOptions?.expiresIn || 60 * 15;
    const publicUrl = options?.providerOptions?.publicUrl || this.config.publicUrl;
    const signFetch = options?.providerOptions?.signFetch || this.config.signFetch || 'none';
    const region = this.config.region || null;
    const key = this.config?.prefix ? `${this.config?.prefix}${data.key}` : data.key;

    switch (signFetch) {
      case 's3': {
        if (publicUrl) {
          // s3 signing requires a bucket url
          throw new MediaProviderError(`S3 signing requires a bucket URL`, {
            code: 'media-provider-signing-requires-bucket-url',
          });
        }
        return {
          url: await getS3SignedUrl(
            this.client,
            new GetObjectCommand({
              Bucket: bucket,
              Key: key,
            }),
            {
              expiresIn,
            },
          ),
        };
      }
      case 'cloudfront': {
        if (!publicUrl) {
          // cloudfront requires a public url
          throw new MediaProviderError(`Cloudfront requires a public URL`, {
            code: 'media-provider-cloudfront-requires-public-url',
          });
        }
        return await this.signCloudfrontUrl(`${publicUrl}/${key}`, { expiresIn });
      }
      case 'none': {
        return {
          url: publicUrl
            ? `${publicUrl}/${key}`
            : `https://${bucket}.s3.${region ? `${region}.` : ''}amazonaws.com/${key}`,
        };
      }
      default:
        throw new MediaProviderError(`Invalid fetch signing method: '${signFetch}'`, {
          code: 'media-provider-invalid-fetch-signing-method',
        });
    }
  }

  private async signCloudfrontUrl(
    url: string,
    options: {
      expiresIn: number;
    },
  ): Promise<Omit<IMediaFetchInstructions, 'id'>> {
    const { cloudfrontSigner } = this.config;
    if (!cloudfrontSigner || !cloudfrontSigner.privateKey || !cloudfrontSigner.keyPairId) {
      throw new MediaProviderError(`Missing CloudFront signer`, {
        code: 'media-provider-missing-cloudfront-signer',
      });
    }

    return {
      url: getCloudfrontSignedUrl({
        policy: JSON.stringify({
          Statement: [
            {
              Resource: url,
              Condition: {
                DateLessThan: {
                  'AWS:EpochTime': Math.floor(Date.now() / 1000) + options.expiresIn,
                },
              },
            },
          ],
        }),
        url,
        keyPairId: cloudfrontSigner.keyPairId,
        privateKey: cloudfrontSigner.privateKey,
      }),
    };
  }
}
