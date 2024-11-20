import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum } from 'class-validator';

import { State } from '../enums/state.enum';
import { ICreateState } from '../interfaces/create-state.interface';

export class CreateStateDto {
  constructor(data: Partial<CreateStateDto>) {
    Object.assign(this, data);
  }

  @Expose()
  @ApiProperty({ description: 'State', enum: State })
  @IsEnum(State)
  readonly state!: State;

  static fromDomain(state: State): CreateStateDto {
    return new CreateStateDto({ state });
  }

  toDomain(): ICreateState {
    return {
      state: this.state,
    };
  }
}
