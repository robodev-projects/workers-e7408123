import { ApiPropertyOptional, ApiPropertyOptions } from '@nestjs/swagger';

export function ApiFilterParamPropertyOptional(options?: ApiPropertyOptions) {
  return (target: any, propertyKey: string) => {
    return ApiPropertyOptional({
      name: `filter[${propertyKey}]`,
      ...options,
    })(target, propertyKey);
  };
}
