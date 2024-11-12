import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import {
  IsFilterProperty,
  IsOrderParamProperty,
  IsOrderProperty,
  OrderItemDto,
  PaginatedListQueryDto,
} from '~common/http/pagination';

import {
  IPushNotificationTokenFilter,
  IPushNotificationTokenPaginationQuery,
  IPushNotificationTokenOrder,
} from '../push-notification.types';

class PushNotificationTokenListFilterQueryDto implements IPushNotificationTokenFilter {
  /**
   * Name
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly provider?: string;
}

class PushNotificationTokenListOrderQueryDto implements IPushNotificationTokenOrder {
  /**
   * Order by provider
   */
  @IsOptional()
  @IsOrderParamProperty(OrderItemDto)
  @Expose()
  provider?: OrderItemDto;

  /**
   * Order by expiresAt
   */
  @IsOptional()
  @IsOrderParamProperty(OrderItemDto)
  @Expose()
  expiresAt?: OrderItemDto;
}

export class IPushNotificationTokenPaginationQueryDto
  extends PaginatedListQueryDto
  implements IPushNotificationTokenPaginationQuery
{
  /**
   * Order by
   */
  @ApiPropertyOptional({ type: PushNotificationTokenListOrderQueryDto })
  @IsOptional()
  @IsOrderProperty(PushNotificationTokenListOrderQueryDto)
  @Expose()
  order?: IPushNotificationTokenOrder;

  /**
   * Filter
   */
  @ApiPropertyOptional({ type: PushNotificationTokenListFilterQueryDto })
  @IsOptional()
  @IsFilterProperty(PushNotificationTokenListFilterQueryDto)
  @Expose()
  filter?: IPushNotificationTokenFilter;
}
