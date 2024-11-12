import { applyDecorators } from '@nestjs/common';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export function IsFilterProperty(type: any) {
  return applyDecorators(
    ValidateNested({ each: true }),
    Type(() => type),
  );
}
