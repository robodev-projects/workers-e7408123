import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsNumber } from 'class-validator';

import { IStateTimePairResponse } from '../interfaces/state-time-pair-response.interface';

export class StateTimePairResponseDto {
  constructor(data: StateTimePairResponseDto) {
    Object.assign(this, data);
  }

  @Expose()
  @ApiProperty({ description: 'Total seconds' })
  @IsNumber()
  readonly totalSeconds!: number;

  @Expose()
  @ApiProperty({ description: 'Start time of the time pair' })
  @IsDate()
  readonly startTime!: Date;

  @Expose()
  @ApiProperty({ description: 'End time of the time pair' })
  @IsDate()
  readonly endTime!: Date;

  @Expose()
  @ApiProperty({ description: 'Start time of the time pair' })
  @IsDate()
  readonly cutStartTime!: Date | null;

  @Expose()
  @ApiProperty({ description: 'End time of the time pair' })
  @IsDate()
  readonly cutEndTime!: Date | null;

  static fromDomain(data: IStateTimePairResponse): StateTimePairResponseDto {
    return new StateTimePairResponseDto({
      totalSeconds: data.totalSeconds,
      startTime: data.startTime,
      endTime: data.endTime,
      cutStartTime: data.cutStartTime || null,
      cutEndTime: data.cutEndTime || null,
    });
  }
}
