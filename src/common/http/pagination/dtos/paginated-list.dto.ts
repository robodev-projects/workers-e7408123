import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { IPaginatedList } from '../interfaces/paginated-list.interface';

export const PaginatedListConstants = {
  page: {
    min: 1,
    default: 1,
  },
  limit: {
    min: 1,
    max: 100,
    default: 20,
  },
};

export class PaginatedListDto<PresentationItemType> {
  @ApiPropertyOptional({ description: 'Page' })
  @Expose()
  readonly page!: number;

  @ApiPropertyOptional({ description: 'Limit' })
  @Expose()
  readonly limit!: number;

  @ApiProperty({ description: 'Items' })
  @Expose()
  readonly items!: PresentationItemType[];

  @ApiProperty({ description: 'Total Items' })
  @Expose()
  readonly totalItems!: number;

  private constructor(data: IPaginatedList<any>) {
    return Object.assign(this, data);
  }

  public static fromDomain<DomainItemType, PresentationItemType>(
    data: IPaginatedList<DomainItemType>,
    PresentationItemFactory: (item: DomainItemType) => PresentationItemType,
  ): PaginatedListDto<PresentationItemType> {
    return new PaginatedListDto({
      page: data.page,
      limit: data.limit,
      items: data.items.map(PresentationItemFactory),
      totalItems: data.totalItems,
    });
  }
}
