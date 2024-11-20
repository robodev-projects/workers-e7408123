import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsUUID, IsString } from 'class-validator';

import { IStateResponse } from '../interfaces/state-response.interface';

export class StateResponseDto {
  constructor(data: Partial<StateResponseDto>) {
    Object.assign(this, data);
  }

  @Expose()
  @ApiProperty({ description: 'Unique identifier of the state' })
  @IsUUID()
  @IsNotEmpty()
  readonly id!: string;

  @Expose()
  @ApiProperty({ description: 'State name' })
  @IsString()
  @IsNotEmpty()
  readonly state!: string;

  @Expose()
  @ApiProperty({ description: 'Creation date of the state' })
  @IsString()
  @IsNotEmpty()
  readonly createdAt!: string;

  static fromDomain(data: IStateResponse): StateResponseDto {
    return new StateResponseDto({
      id: data.id,
      state: data.state,
      createdAt: data.createdAt,
    });
  }

  toDomain(): IStateResponse {
    return {
      id: this.id,
      state: this.state,
      createdAt: this.createdAt,
    };
  }
}
