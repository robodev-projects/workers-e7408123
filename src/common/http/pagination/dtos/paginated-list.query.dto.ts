import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

import { PaginatedListConstants } from '../dtos/paginated-list.dto';

export class PaginatedListQueryDto {
  static readonly ORDER_KEY = 'order';

  @Expose()
  @ApiProperty({ description: 'Page' })
  @IsNumber()
  @Type(() => Number)
  @Min(PaginatedListConstants.page.min)
  page: number = PaginatedListConstants.page.default;

  @Expose()
  @ApiProperty({ description: 'Limit' })
  @IsNumber()
  @Type(() => Number)
  @Min(PaginatedListConstants.limit.min)
  @Max(PaginatedListConstants.limit.max)
  limit: number = PaginatedListConstants.limit.default;
}
