import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsOptional, IsNumber } from 'class-validator';

export class LongRunningJobDataDto {
  @Expose()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @ApiProperty({ default: 5, required: false })
  readonly waitFor: number = 5;
}
