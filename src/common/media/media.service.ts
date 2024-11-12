import { Injectable } from '@nestjs/common';
import * as mime from 'mime-types';

import { BadRequestException } from '~common/exceptions';
import { makeUUID } from '~common/utils/short-uuid';

import { MediaPersistor } from './media-persistor.abstract';
import { MediaConfig } from './media.config';
import { MediaError } from './media.exceptions';
import { MediaLoader } from './media.loader';
import type {
  IMediaFetchInstructions,
  IMediaFetchRequest,
  IMedia,
  IMediaAssociation,
  IMediaConstraints,
  IMediaId,
  IMediaResourceName,
  IMediaUploadInstructions,
  IMediaUploadRequest,
  IMediaFile,
  INamedIMediaConstraints,
  IMediaAttachRequest,
} from './media.types';

type Optional<T, K extends keyof T> = Omit<T, K> & { [P in keyof T]?: T[P] | undefined };

@Injectable()
export class MediaService {
  public defaultProvider?: string;

  constructor(
    private readonly mediaPersistor: MediaPersistor,
    private readonly mediaLoader: MediaLoader,
    private readonly mediaConfig: MediaConfig,
  ) {
    this.defaultProvider = this.mediaConfig.defaultProvider;
  }

  /**
   * Create a raw upload request
   */
  public async createRawUploadRequest(
    data: Optional<IMediaFile, 'mimeType'>,
    options: {
      key?: string;
      method?: string;
      provider?: string;
      providerOptions?: Record<string, any>;
    } = {},
  ): Promise<Omit<IMediaUploadInstructions, 'id'>> {
    const mimeType = data.mimeType || mime.lookup(data.fileName) || 'application/octet-stream';
    const key = options.key || `uncategorized/${makeUUID()}`;

    const provider = options.provider || this.defaultProvider;
    if (!provider || !(provider in this.mediaLoader.providers)) {
      throw new MediaError('Media provider not found', { code: 'media-provider-not-found' });
    }

    return await this.mediaLoader.providers[provider].createUploadRequest({ ...data, mimeType }, { ...options, key });
  }

  /**
   * Create a raw fetch request
   */
  async createRawFetchRequest(
    data: {
      key: string;
    },
    options: {
      provider: string;
      providerOptions?: Record<string, any>;
    },
  ): Promise<Omit<IMediaFetchInstructions, 'id'>> {
    if (!options.provider || !(options.provider in this.mediaLoader.providers)) {
      throw new MediaError('Media provider not found', { code: 'media-provider-not-found' });
    }

    return await this.mediaLoader.providers[options.provider].createFetchRequest(
      { key: data.key },
      { providerOptions: options.providerOptions },
    );
  }

  /**
   * Get a media file
   */
  public async find(where: { id: string } | { key: string }): Promise<IMedia | null> {
    return this.mediaPersistor.find(where);
  }

  /**
   * Get a list of media files filtered by match options
   */
  public async list(options: {
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
      provider?: string;
    };
    take?: number;
    skip?: number;
  }): Promise<IMedia[]> {
    return this.mediaPersistor.list({ take: 10, skip: 0, ...options });
  }

  /**
   * Manually create a new media file
   *  - bypasses all checks, use with caution
   */
  public create(data: IMedia): Promise<IMedia> {
    return this.mediaPersistor.create(data);
  }

  /**
   * Manually update a media file
   *  - bypasses all checks, use with caution
   */
  public update(where: { id: IMediaId } | { key: string }, data: Partial<IMedia>): Promise<IMedia> {
    return this.mediaPersistor.update(where, data);
  }

  /**
   * Create a new media file and return upload instructions
   *  - provides all the necessary authorization
   */
  public async createMediaUploadRequest(
    data: Optional<IMediaAssociation & IMediaUploadRequest, 'mimeType'> & { resourceName: IMediaResourceName },
    options: {
      key?: string;
      method?: string;
      constraints?: IMediaConstraints;
      provider?: string;
      providerOptions?: Record<string, any>;
    } = {},
  ): Promise<IMediaUploadInstructions> {
    const provider = options.provider || this.defaultProvider;

    if (!provider || !(provider in this.mediaLoader.providers)) {
      throw new MediaError('Media provider not found', { code: 'media-provider-not-found' });
    }

    const id = makeUUID();
    const key = options.key || `${data.resourceName}/${id}`;
    const mimeType = data.mimeType || mime.lookup(data.fileName) || 'application/octet-stream';

    if (!data.resourceName) {
      throw new MediaError('Resource name not provided', { code: 'media-resource-name-not-provided' });
    }

    // enhancement: get registered constraints, or from the resource
    //  - modules could register their constraints using @MediaConstraints decorator, then be able to use a
    //  string as a constraint name
    //  - another option is to register a prefix, and a handler function, that will be called at media creation

    // validate request constraints
    await this.validateConstraints({ ...data, mimeType }, options.constraints);

    // create media record
    await this.create({ ...data, id, key, mimeType, provider });

    return {
      ...(await this.mediaLoader.providers[provider].createUploadRequest({ ...data, mimeType }, { ...options, key })),
      id,
    };
  }

  /**
   * Return upload instructions for replacing an existing media file
   *  - provides all the necessary authorization
   *  - initiating the upload will unmark the file as uploaded and validated
   *  - the original file will be overwritten
   */
  public async createMediaReplaceRequest(
    data: Optional<IMediaAssociation & IMediaUploadRequest & { id: string }, 'mimeType'>,
    options: {
      method?: string;
      constraints?: IMediaConstraints;
      providerOptions?: Record<string, any>;
    } = {},
  ): Promise<IMediaUploadInstructions> {
    const mimeType = data.mimeType || mime.lookup(data.fileName) || 'application/octet-stream';

    await this.validateConstraints({ ...data, mimeType }, options.constraints);

    const media = await this.update({ id: data.id }, { ...data, mimeType, validated: false, uploaded: false });

    if (!media.provider || !(media.provider in this.mediaLoader.providers)) {
      throw new MediaError('Media provider not found', { code: 'media-provider-not-found' });
    }

    // enhancement: get registered constraints, or from the resource, see above

    return {
      ...(await this.mediaLoader.providers[media.provider].createUploadRequest(
        { ...data, mimeType },
        { ...options, key: media.key },
      )),
      id: media.id,
    };
  }

  /**
   * Create a fetch request for a media file
   *  - returns fetch instructions
   *  - provides all the necessary authorization
   */
  async createMediaFetchRequest(
    data: IMediaFetchRequest,
    media?: IMedia,
    options: {
      providerOptions?: Record<string, any>;
    } = {},
  ): Promise<IMediaFetchInstructions> {
    if (!media) {
      const foundMedia = await this.find({ id: data.id });
      if (!foundMedia) {
        throw new BadRequestException('Media not found');
      }
      media = foundMedia;
    }
    if (data.resourceName && media.resourceName !== data.resourceName) {
      throw new MediaError('Media resource name mismatch');
    }

    if (!media.provider || !(media.provider in this.mediaLoader.providers)) {
      throw new MediaError('Media provider not found', { code: 'media-provider-not-found' });
    }

    const fetchInstructions = await this.mediaLoader.providers[media.provider].createFetchRequest(
      { key: media.key },
      options,
    );

    return {
      ...fetchInstructions,
      id: media.id,
      url: fetchInstructions.url,
    };
  }

  /**
   * Create fetch requests in bulk
   */
  public async createMediaFetchRequests(
    media: Array<string | IMedia>,
    options: {
      providerOptions?: Record<string, any>;
    } = {},
  ): Promise<Record<string, IMediaFetchInstructions>> {
    const mediaIds = media.filter((item): item is string => typeof item === 'string');
    const combinedMedia = [
      ...media.filter((item): item is IMedia => !!item && typeof item !== 'string' && !!item.id),
      ...(mediaIds.length > 0
        ? await this.list({
            where: { id: mediaIds },
            take: mediaIds.length,
          })
        : []),
    ];
    const fetchRequests: Record<string, IMediaFetchInstructions> = {};
    for (const mediaItem of combinedMedia) {
      fetchRequests[mediaItem.id] = await this.createMediaFetchRequest({ id: mediaItem.id }, mediaItem, options);
    }
    return fetchRequests;
  }

  /**t
   * Create fetch requests in bulk and apply them to an object
   */
  public async applyMediaFetchRequests<T = { [key: string]: any }, In = T | T[]>(
    data: In,
    keyProperty: string,
  ): Promise<In> {
    const items = Array.isArray(data) ? data : [data];
    const media = await this.createMediaFetchRequests(items.map((item) => item[keyProperty]?.id));
    for (const item of items) {
      if (item[keyProperty]?.id && media[item[keyProperty].id]) {
        item[keyProperty] = { ...item[keyProperty], ...media[item[keyProperty].id] };
      }
    }
    return Array.isArray(data) ? (items as In) : (items[0] as In);
  }

  /**
   * Validate the upload
   *  - check if the file exists and matches the constraints
   */
  public async validate(
    request: IMediaId | IMediaAttachRequest,
    resource?: IMediaResourceName | INamedIMediaConstraints,
    media?: IMedia,
  ): Promise<IMedia> {
    const id = typeof request === 'string' ? request : request.id;
    if (!media) {
      const foundMedia = await this.find({ id });
      if (!foundMedia) {
        throw new BadRequestException('Media not found');
      }
      media = foundMedia;
    }

    const resourceName = typeof resource === 'string' ? resource : resource?.name;

    if (resourceName && media.resourceName !== resourceName) {
      throw new MediaError('Media file mismatch', { code: 'media-file-mismatch' });
    }

    if (media.uploaded && media.validated) {
      // already validated
      return media;
    }

    if (!media.provider || !(media.provider in this.mediaLoader.providers)) {
      throw new MediaError('Media provider not found', { code: 'media-provider-not-found' });
    }

    // check if file exists, and is the same as the one in the media record
    const { fileSize, mimeType } = await this.mediaLoader.providers[media.provider].getMeta(media.key);

    if (media.fileSize !== fileSize || media.mimeType !== mimeType) {
      // enhancement, file size within % ?
      // enhancement, mime type equivalence ?
      // enhancement, soft validation ?
      throw new MediaError('Media file validation error', { code: 'media-file-validation-error' });
    }

    // all good !
    return await this.update({ id: media.id }, { uploaded: true, validated: true });
  }

  /**
   * Associate an existing media file with a resource
   */
  public async associate(
    media: IMediaId | IMedia,
    association: IMediaAssociation,
    options?: {
      override: boolean;
    },
  ): Promise<IMedia> {
    if (typeof media === 'string') {
      const foundMedia = await this.find({ id: media });
      if (!foundMedia) {
        throw new BadRequestException('Media not found');
      }
      media = foundMedia;
    }

    if (Object.entries(association).some(([key, value]) => value && media[key as keyof IMedia] === value)) {
      // noting to do
      return media;
    }

    if (
      !options?.override &&
      Object.entries(association).some(
        ([key, value]) => value && media[key as keyof IMedia] && media[key as keyof IMedia] !== value,
      )
    ) {
      throw new BadRequestException('Media association conflict', { code: 'media-association-conflict' });
    }

    return await this.update({ id: media.id }, { ...association });
  }

  private async validateConstraints(media: IMediaFile, constraints?: IMediaConstraints) {
    if (!media.fileSize) {
      throw new MediaError('File size not provided', { code: 'media-file-size-not-provided' });
    }

    if (constraints?.fileSize && media.fileSize > constraints?.fileSize) {
      // enhancement, global max ?
      throw new MediaError('File size exceeded', { code: 'media-file-size-exceeded' });
    }

    if (!media.fileName) {
      throw new MediaError('File name not provided', { code: 'media-file-name-not-provided' });
    }

    if (!media.mimeType) {
      throw new MediaError('Mime type not provided', { code: 'media-mime-type-not-provided' });
    }

    // enhancement, global forbidden mime types
    if (constraints?.mimeTypes) {
      const [type, subtype] = media.mimeType.split('/');
      if (
        !constraints?.mimeTypes.some((m) => {
          const [allowedType, allowedSubtype] = m.split('/');
          return type === allowedType && (allowedSubtype === '*' || subtype === allowedSubtype);
        })
      ) {
        throw new MediaError('Mime type not allowed', {
          code: 'media-mime-type-not',
        });
      }
    }
  }
}
