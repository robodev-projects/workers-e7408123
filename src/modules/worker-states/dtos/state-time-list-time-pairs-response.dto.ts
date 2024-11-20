import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';

import { IStateTimeListTimePairsResponse } from '../interfaces/state-time-list-time-pairs-response.interface';
import { StateTimePairResponseDto } from './state-time-pair-response.dto';

export class StateTimeListTimePairsResponseDto {
  constructor(data: Partial<StateTimeListTimePairsResponseDto>) {
    Object.assign(this, data);
  }

  @Expose()
  @ApiProperty({ description: 'List of time pairs', type: [StateTimePairResponseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StateTimePairResponseDto)
  readonly timePairs!: StateTimePairResponseDto[];

  @Expose()
  @ApiProperty({ description: 'Total seconds' })
  @IsNumber()
  readonly totalSeconds!: number;

  static fromDomain(data: IStateTimeListTimePairsResponse): StateTimeListTimePairsResponseDto {
    return new StateTimeListTimePairsResponseDto({
      timePairs: data.timePairs.map(StateTimePairResponseDto.fromDomain),
      totalSeconds: data.totalSeconds,
    });
  }
}
