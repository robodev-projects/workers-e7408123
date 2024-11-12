import type { IMedia, IMediaId, IMediaResourceName } from './media.types';

export abstract class MediaPersistor {
  public abstract find(where: { id: IMediaId } | { key: string }): Promise<IMedia | null>;
  public abstract list(options: {
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
      userId?: string;
    };
    skip?: number;
    take?: number;
  }): Promise<IMedia[]>;
  public abstract create(data: IMedia): Promise<IMedia>;
  public abstract update(where: { id: IMediaId } | { key: string }, data: Partial<IMedia>): Promise<IMedia>;
}
