import { Injectable } from '@nestjs/common';
import { type Media } from '@prisma/client';

import { PrismaService } from '~database/prisma';

import { MediaPersistor } from '../../media-persistor.abstract';
import type { IMedia, IMediaId, IMediaResourceName } from '../../media.types';

@Injectable()
export class PrismaMediaPersistor implements MediaPersistor {
  constructor(private readonly prismaService: PrismaService) {}

  private toIMedia(media: Omit<Media, 'blob'>): IMedia {
    return {
      id: media.id,
      key: media.key,
      resourceName: media.resourceName,

      fileName: media.fileName,
      fileSize: media.fileSize,
      mimeType: media.mimeType,

      module: media.module || undefined,
      type: media.type || undefined,
      resourceId: media.resourceId || undefined,
      userId: media.userId || undefined,

      uploaded: media.uploaded,
      validated: media.validated,
      provider: media.provider,

      meta: media.meta as Record<string, any>,
    };
  }

  async find(where: { id: IMediaId } | { key: string }): Promise<IMedia | null> {
    const result = await this.prismaService.client.media.findUnique({
      where: 'id' in where ? { id: where.id } : { key: where.key },
      omit: { blob: true },
    });
    return result ? this.toIMedia(result) : null;
  }

  async list(options: {
    where: {
      id?: IMediaId | IMediaId[];
      key?: string | string[];
      resourceName?: IMediaResourceName;
      module?: string;
      type?: string;
      resourceId?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
      uploaded?: boolean;
      validated?: boolean;
      userId?: string;
    };
    skip?: number;
    take?: number;
  }): Promise<IMedia[]> {
    const where: Record<string, any> = {};
    for (const [key, value] of Object.entries(options.where)) {
      switch (key) {
        case 'id':
        case 'key':
          where[key] = Array.isArray(value) ? { in: value } : value;
          break;
        case 'resourceName':
        case 'module':
        case 'type':
        case 'resourceId':
        case 'fileName':
        case 'fileSize':
        case 'mimeType':
        case 'uploaded':
        case 'validated':
        case 'provider':
        case 'userId':
          where[key] = value;
          break;
        default:
          throw new Error('Invalid where parameter');
      }
    }
    return this.prismaService.client.media
      .findMany({
        where,
        skip: options.skip ?? 0,
        take: options.take ?? 10,
        omit: { blob: true },
      })
      .then((media) => media.map(this.toIMedia));
  }

  async create(data: IMedia): Promise<IMedia> {
    return this.prismaService.client.media.create({ data, omit: { blob: true } }).then(this.toIMedia);
  }

  async update(
    where: ({ id: IMediaId } | { key: string }) & { resourceName?: string },
    data: Partial<IMedia>,
  ): Promise<IMedia> {
    if (!('id' in where) && !('key' in where)) {
      throw new Error('Either id or key must be provided');
    }

    return this.prismaService.client.media
      .update({
        where,
        data: {
          ...data,
        },
        omit: {
          blob: true,
        },
      })
      .then(this.toIMedia);
  }
}
