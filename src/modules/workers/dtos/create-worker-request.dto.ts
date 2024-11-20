import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

import { ICreateWorkerRequest } from '~modules/workers/interfaces/create-worker-request.interface';

export class CreateWorkerRequestDto {
  constructor(data: Partial<CreateWorkerRequestDto>) {
    Object.assign(this, data);
  }

  @Expose()
  @ApiProperty({ description: 'Full name of the worker' })
  @IsString()
  @IsNotEmpty()
  readonly fullName!: string;

  static fromDomain(data: ICreateWorkerRequest): CreateWorkerRequestDto {
    return new CreateWorkerRequestDto({
      fullName: data.fullName,
    });
  }

  toDomain(): ICreateWorkerRequest {
    return {
      fullName: this.fullName,
    };
  }
}
