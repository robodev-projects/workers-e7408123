import { IPaginatedListQuery, OrderItemDto } from '~common/http/pagination';
import { IMediaAttachRequest, IMediaFetchInstructions } from '~common/media';

export interface IRocket {
  id: string;
  name: string;
  model: string;

  picture?: IMediaFetchInstructions;
  timelapses?: Array<IMediaFetchInstructions>;
}

export interface IRocketCreate {
  id?: string;
  name: string;
  model: string;
}

export interface IRocketUpdate {
  id: string;
  name?: string;
  model?: string;
  picture?: IMediaAttachRequest;
  timelapses?: Array<IMediaAttachRequest>;
}

export interface IRocketFilter {
  ids?: string[];
  name?: string;
  model?: string;
  search?: string;
}

export interface IRocketOrder {
  id?: OrderItemDto;
  name?: OrderItemDto;
  model?: OrderItemDto;
  createdAt?: OrderItemDto;
}

export interface IRocketList extends IPaginatedListQuery<IRocketFilter, IRocketOrder> {}
