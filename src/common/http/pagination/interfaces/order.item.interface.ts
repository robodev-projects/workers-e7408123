import { OrderDirection } from '../types/order.direction.type';

export interface IOrderItem {
  propertyName: string;
  direction: OrderDirection;
  priority: number;
}
