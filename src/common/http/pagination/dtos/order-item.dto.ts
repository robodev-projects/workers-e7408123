import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

import { OrderDirection, OrderDirectionEnum } from '../types/order.direction.type';

export class OrderItemDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  propertyName!: string;

  @Expose()
  @IsEnum(OrderDirectionEnum)
  direction!: OrderDirection;

  @Expose()
  @IsNumber()
  @Min(1)
  priority!: number;
}
