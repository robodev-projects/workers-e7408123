import { OrderItemDto, IPaginatedListQuery } from '~common/http/pagination';
import type { IMediaFetchInstructions, MediaAttachRequestDto } from '~common/media';

import { UserRole } from './user.constants';

export interface IUser {
  id: string;
  email?: string;
  name?: string;
  roles: UserRole[];
  profilePicture?: IMediaFetchInstructions;
  createdAt: Date;
}

export interface IUserCreate {
  id?: string;
  email?: string;
  name?: string;
  roles?: UserRole[];
}

export interface IUserUpdate {
  email?: string;
  name?: string;
  roles?: UserRole[];
  profilePicture?: MediaAttachRequestDto;
}

export interface IUserFilter {
  ids?: string[];
  email?: string;
  name?: string;
  search?: string;
}

export interface IUserOrder {
  name?: OrderItemDto;
  email?: OrderItemDto;
  createdAt?: OrderItemDto;
}

export interface IUserList extends IPaginatedListQuery<IUserFilter, IUserOrder> {}
