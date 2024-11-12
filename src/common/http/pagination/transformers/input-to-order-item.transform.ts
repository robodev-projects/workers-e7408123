import { plainToClass, Transform } from 'class-transformer';

import { OrderItemDto } from '../dtos/order-item.dto';
import { IOrderItem } from '../interfaces/order.item.interface';
import { OrderDirection } from '../types/order.direction.type';

function transformInputToOrderItem(propertyName: string) {
  return ({ value }: { value: any }): IOrderItem | string => {
    if (typeof value !== 'string') {
      // We return an empty string so the validation will fail, because the value to be validated should be an instance of OrderItemDto class.
      return '';
    }
    const regex = /^(asc|desc):([1-9]\d*)$/;
    const match = value.match(regex);
    if (!match) {
      // If the value doesn't match the regex, we return the value as is and the validation will fail.
      return value;
    }
    const priority = parseInt(match[2], 10);

    if (isNaN(priority) || priority <= 0) {
      // If the value cannot be parsed to a number or the number is not greater than 0, we return the value as is and the validation will fail.
      return value;
    }

    const direction = value.split(':')[0] as OrderDirection;

    return plainToClass(OrderItemDto, {
      propertyName,
      direction: direction.toUpperCase(),
      priority,
    });
  };
}

export function TransformInputToOrderItem(): PropertyDecorator {
  return (target: any, propertyName: string | symbol) => {
    Transform(transformInputToOrderItem(propertyName as string))(target, propertyName);
  };
}
