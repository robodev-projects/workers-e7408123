import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

import {
  IsFilterProperty,
  IsOrderParamProperty,
  IsOrderProperty,
  OrderItemDto,
  PaginatedListQueryDto,
} from '~common/http/pagination';
import { TransformInputToArray } from '~common/validate';

import { IUserFilter, IUserList, IUserOrder } from '../user.types';

class UserListFilterQueryDto implements IUserFilter {
  /**
   * Ids
   */
  @Expose()
  @TransformInputToArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  readonly ids?: string[];

  /**
   * Email
   */
  @Expose()
  @IsEmail()
  @IsOptional()
  readonly email?: string;

  /**
   * Name
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly name?: string;

  /**
   *
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly search?: string;
}

class UserListOrderQueryDto implements IUserOrder {
  /**
   * Order by Email
   */
  @IsOptional()
  @IsOrderParamProperty(OrderItemDto)
  @Expose()
  email?: OrderItemDto;

  /**
   * Order by name
   */
  @IsOptional()
  @IsOrderParamProperty(OrderItemDto)
  @Expose()
  name?: OrderItemDto;

  /**
   * Order by  Created at
   */
  @IsOptional()
  @IsOrderParamProperty(OrderItemDto)
  @Expose()
  createdAt?: OrderItemDto;
}

export class UserListQueryDto extends PaginatedListQueryDto implements IUserList {
  /**
   * Order by
   */
  @ApiPropertyOptional({ type: UserListOrderQueryDto })
  @IsOptional()
  @IsOrderProperty(UserListOrderQueryDto)
  @Expose()
  order?: IUserOrder;

  /**
   * Filter
   */
  @ApiPropertyOptional({ type: UserListFilterQueryDto })
  @IsOptional()
  @IsFilterProperty(UserListFilterQueryDto)
  @Expose()
  filter?: IUserFilter;
}
