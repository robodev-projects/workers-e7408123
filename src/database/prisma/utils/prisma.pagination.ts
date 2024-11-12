import { OrderItemDto } from '~common/http/pagination/dtos/order-item.dto';

export type IPaginationOrderByPrisma = Record<string, 'asc' | 'desc'>;

/**
 * Generate Prisma pagination order
 */
export function generatePaginationOrderByPrisma<T>(
  listOrder?: Partial<Record<keyof T, OrderItemDto>>,
): IPaginationOrderByPrisma[] | undefined {
  if (!listOrder) return undefined;

  const entries: [string, OrderItemDto][] = Object.entries(listOrder);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const filteredArr = entries.filter(([key, value]) => {
    return value !== undefined;
  });

  filteredArr.sort((a, b) => {
    const indexA = a[1].priority;
    const indexB = b[1].priority;
    return indexA - indexB;
  });

  const result: IPaginationOrderByPrisma[] = [];
  filteredArr.forEach(([key, value]) => {
    result.push({
      [key]: value.direction.toLowerCase() as 'asc' | 'desc',
    });
  });

  return result;
}
