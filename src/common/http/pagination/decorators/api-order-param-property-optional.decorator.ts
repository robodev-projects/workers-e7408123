import { ApiPropertyOptional, ApiPropertyOptions } from '@nestjs/swagger';

export function ApiOrderParamPropertyOptional(options?: ApiPropertyOptions) {
  return (target: any, propertyKey: string) => {
    return ApiPropertyOptional({
      type: String,
      name: `order[${propertyKey}]`,
      description: `Order by ${propertyKey}. Value should be in a form of "asc:n" or "desc:n", where n is a number greater than 0 and indicates the priority of the ordering parameters.`,
      ...options,
    })(target, propertyKey);
  };
}
