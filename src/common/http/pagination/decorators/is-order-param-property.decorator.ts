import { applyDecorators } from '@nestjs/common';
import { Type } from 'class-transformer';
import { ValidateNested, ValidationArguments } from 'class-validator';

import { TransformInputToOrderItem } from '../transformers/input-to-order-item.transform';

export function IsOrderParamProperty(type: any) {
  return applyDecorators(
    ValidateNested({
      each: true,
      message: ({ property }: ValidationArguments) =>
        `order[${property}] should be formatted as "asc:n" or "desc:n", where n is a number greater than 0`,
    }),
    Type(() => type),
    TransformInputToOrderItem(),
  );
}
