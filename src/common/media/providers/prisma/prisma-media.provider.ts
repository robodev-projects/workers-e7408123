import { Injectable, OnModuleInit } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

import { CoreConfig } from '~common/core';

import { PrismaService } from '~database/prisma';

import type { MediaProvider } from '../../media-provider.abstract';
import { MediaProviderError } from '../../media.exceptions';
import { MediaLoader } from '../../media.loader';
import type {
  IMediaConstraints,
  IMediaFetchInstructions,
  IMediaFile,
  IMediaUploadInstructions,
} from '../../media.types';
import { PrismaMediaProviderConfig } from './prisma-media.provider.config';
import { IPrismaMediaProviderJWTToken, PRISMA_MEDIA_PROVIDER_NAME } from './prisma-media.provider.types';

@Injectable()
export class PrismaMediaProvider implements MediaProvider, OnModuleInit {
  private readonly media;
  private readonly secret: string;

  constructor(
    private readonly mediaProviderConfig: PrismaMediaProviderConfig,
    private readonly coreConfig: CoreConfig,
    private readonly mediaLoader: MediaLoader,
    private readonly prismaService: PrismaService,
  ) {
    this.media = this.prismaService.client.media;
    this.secret = this.mediaProviderConfig.secret;
  }

  onModuleInit() {
    this.mediaLoader.registerProvider(PRISMA_MEDIA_PROVIDER_NAME, this);
  }

  /**
   * Return the object metadata
   */
  public async getMeta(key: string): Promise<{ fileSize?: number; mimeType?: string }> {
    // if it was stored, its already in the database and was validated
    const metadata = await this.media.findUnique({ where: { key }, select: { fileSize: true, mimeType: true } });
    if (!metadata) {
      throw new MediaProviderError(`Media not found`, {
        code: 'media-provider-media-not-found',
      });
    }
    return metadata;
  }

  public async createUploadRequest(
    file: IMediaFile,
    options: {
      // file key
      key: string;

      // suggested upload method
      method?: string;

      // arbitrary options for the provider
      providerOptions?: {
        // expiration time in seconds
        expiresIn?: number;
      };

      constraints?: IMediaConstraints;
    },
  ): Promise<Omit<IMediaUploadInstructions, 'id'>> {
    const key = options.key;
    const expiresIn = options?.providerOptions?.expiresIn || 60 * 15;

    const method = options.method || this.mediaProviderConfig.uploadMethods[0];
    if (!this.mediaProviderConfig.uploadMethods.includes(method)) {
      throw new MediaProviderError(`Invalid upload method: '${method}'`, {
        code: 'media-provider-invalid-upload-method',
      });
    }

    const [token] = await this.signRequest(
      {
        key,
        fsz: file.fileSize.toString(),
        mtp: file.mimeType,
      },
      {
        audience: 'media:upload',
        expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
      },
    );

    switch (method) {
      case 'post': {
        return {
          method: 'post',
          url: `${this.coreConfig.apiBaseUrl}/media/provider/prisma/upload`,
          fields: [
            ['key', key],
            ['fileSize', file.fileSize.toString()],
            ['mimeType', file.mimeType.toString()],
            ['token', token],
          ],
          provider: PRISMA_MEDIA_PROVIDER_NAME,
        };
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
      providerOptions?: {
        // expiration time in seconds
        expiresIn?: number;

        publicUrl?: string;

        signFetch?: boolean;
      };
    },
  ): Promise<Omit<IMediaFetchInstructions, 'id'>> {
    const expiresIn = options?.providerOptions?.expiresIn || this.mediaProviderConfig.signFetchExpiresIn;
    const signFetch = options?.providerOptions?.signFetch ?? this.mediaProviderConfig.signFetch ?? false;
    const key = data.key;

    let url =
      options?.providerOptions?.publicUrl || this.mediaProviderConfig.publicUrl || '/media/provider/prisma/fetch';
    if (url.startsWith('/')) {
      url = this.coreConfig.apiBaseUrl + url;
    }

    url += `/${key}`;

    const [token] = await this.signRequest(
      { key },
      { audience: 'media:fetch', expiresAt: Math.floor(Date.now() / 1000) + expiresIn },
    );

    if (signFetch) {
      url += `?token=${token}`;
    }

    return {
      url,
    };
  }

  private async signRequest(
    payload: { key: string } & Record<string, any>,
    options: { audience: 'media:upload' | 'media:fetch'; expiresAt: number; prefix?: string },
  ): Promise<[string, IPrismaMediaProviderJWTToken]> {
    if (!this.secret) {
      throw new Error('JWT signing is not configured');
    }
    const iat = Math.floor(Date.now() / 1000);
    const tokenData: IPrismaMediaProviderJWTToken = {
      ...payload,
      iat,
      exp: options.expiresAt,
      aud: options.audience,
    };
    const token = await jwt.sign(tokenData, this.secret);
    return [options.prefix ? `${options.prefix}${token}` : token, tokenData];
  }

  private async verifyRequest(
    rawToken: string,
    options: { audience: string; prefix?: string },
  ): Promise<IPrismaMediaProviderJWTToken | null> {
    if (!this.secret) {
      throw new Error('JWT signing is not configured');
    }
    if (!rawToken) {
      throw new Error('No token provided');
    }
    const token = options.prefix ? rawToken.replace(RegExp('^' + options.prefix), '') : rawToken;
    const decoded = await jwt.decode(token);
    if (!decoded || typeof decoded !== 'object' || !decoded.aud || decoded.aud !== options.audience) {
      return null;
    }
    try {
      await jwt.verify(token, this.secret);
    } catch (err: any) {
      return null;
    }
    return decoded as IPrismaMediaProviderJWTToken;
  }

  public async validateAndUpload(token: IPrismaMediaProviderJWTToken | string, blob: Buffer) {
    const request = typeof token === 'string' ? await this.verifyRequest(token, { audience: 'media:upload' }) : token;

    if (!request) {
      throw new MediaProviderError(`Invalid token`, {
        code: 'media-provider-invalid-token',
      });
    }

    const { key } = request;
    const media = await this.prismaService.client.media.findUnique({ where: { key } });
    if (!media) {
      throw new MediaProviderError(`Media not found`, {
        code: 'media-provider-media-not-found',
      });
    }

    if (media.uploaded) {
      throw new MediaProviderError(`Media already uploaded`, {
        code: 'media-provider-media-already-uploaded',
      });
    }

    const updated = await this.prismaService.client.media.update({
      where: { key },
      data: {
        blob,
        // assume file validated by middleware
        validated: true,
        uploaded: true,
      },
    });

    return updated;
  }

  public async validateAndFetch(token: IPrismaMediaProviderJWTToken | string) {
    const request = typeof token === 'string' ? await this.verifyRequest(token, { audience: 'media:fetch' }) : token;

    if (!request) {
      throw new MediaProviderError(`Invalid token`, {
        code: 'media-provider-invalid-token',
      });
    }

    const { key } = request;
    const media = await this.prismaService.client.media.findUnique({
      where: { key },
      select: {
        blob: true,
        key: true,
        fileSize: true,
        mimeType: true,
        fileName: true,
        uploaded: true,
        validated: true,
      },
    });

    if (!media) {
      throw new MediaProviderError(`Media not found`, {
        code: 'media-provider-media-not-found',
      });
    }

    if (!media.uploaded || !media.validated) {
      throw new MediaProviderError(`Media not validated`, {
        code: 'media-provider-media-not-validated',
      });
    }

    return media;
  }
}
