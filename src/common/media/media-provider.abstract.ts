import type { IMediaConstraints, IMediaFetchInstructions, IMediaFile, IMediaUploadInstructions } from './media.types';

export abstract class MediaProvider {
  abstract getMeta(
    key: string,
    options?: {
      providerOptions?: {
        bucket?: string;
      };
    },
  ): Promise<{ fileSize?: number; mimeType?: string }>;

  abstract createUploadRequest(
    file: IMediaFile,
    options: {
      // file key
      key: string;

      // suggested upload method
      method?: string;

      // arbitrary options for the provider
      providerOptions?: Record<string, any>;

      constraints?: IMediaConstraints;
    },
  ): Promise<Omit<IMediaUploadInstructions, 'id'>>;

  abstract createFetchRequest(
    data: { key: string },
    options: {
      // arbitrary options for the provider
      providerOptions?: Record<string, any>;
    },
  ): Promise<Omit<IMediaFetchInstructions, 'id'>>;
}
