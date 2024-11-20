import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { IStateListResponse } from '../interfaces/state-list-response.interface';
import { StateResponseDto } from './state-response.dto';

export class StateListResponseDto {
  constructor(data: Partial<StateListResponseDto>) {
    Object.assign(this, data);
  }

  @Expose()
  @ApiProperty({ description: 'List of states', type: [StateResponseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StateResponseDto)
  readonly states!: StateResponseDto[];

  static fromDomain(data: IStateListResponse): StateListResponseDto {
    return new StateListResponseDto({
      states: data.states.map(StateResponseDto.fromDomain),
    });
  }

  toDomain(): IStateListResponse {
    return {
      states: this.states.map((state) => state.toDomain()),
    };
  }
}
