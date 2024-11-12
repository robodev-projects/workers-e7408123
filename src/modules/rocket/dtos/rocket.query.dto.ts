import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString, IsUUID } from 'class-validator';

import {
  ApiOrderParamPropertyOptional,
  IsFilterProperty,
  IsOrderParamProperty,
  IsOrderProperty,
  OrderItemDto,
  PaginatedListQueryDto,
} from '~common/http/pagination';
import { TransformInputToArray } from '~common/validate';

import type { IRocketFilter, IRocketList, IRocketOrder } from '../rocket.types';

class RocketListFilterQueryDto implements IRocketFilter {
  /**
   * Ids
   */
  @Expose()
  @TransformInputToArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  readonly ids?: string[];

  /**
   * Name
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly name?: string;

  /**
   * Model
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly model?: string;

  /**
   * Free search
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly search?: string;
}

class RocketListOrderQueryDto implements IRocketOrder {
  /**
   * Order by id
   */
  @IsOptional()
  @IsOrderParamProperty(OrderItemDto)
  @Expose()
  id?: OrderItemDto;

  /**
   * Order by name
   */
  @IsOptional()
  @IsOrderParamProperty(OrderItemDto)
  @Expose()
  name?: OrderItemDto;

  /**
   * Order by model
   */
  @IsOptional()
  @IsOrderParamProperty(OrderItemDto)
  @Expose()
  model?: OrderItemDto;

  /**
   * Order by created at
   */
  @ApiOrderParamPropertyOptional()
  @IsOptional()
  @IsOrderParamProperty(OrderItemDto)
  @Expose()
  createdAt?: OrderItemDto;
}

export class RocketQueryDto extends PaginatedListQueryDto implements IRocketList {
  /**
   * Order by
   */
  @ApiPropertyOptional({ type: RocketListOrderQueryDto })
  @IsOptional()
  @IsOrderProperty(RocketListOrderQueryDto)
  @Expose()
  order?: IRocketOrder;

  /**
   * Filter
   */
  @ApiPropertyOptional({ type: RocketListFilterQueryDto })
  @IsOptional()
  @IsFilterProperty(RocketListFilterQueryDto)
  @Expose()
  filter?: IRocketFilter;
}
