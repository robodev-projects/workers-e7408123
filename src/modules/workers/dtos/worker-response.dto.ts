import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsUUID } from 'class-validator';

import { IWorkerResponse } from '~modules/workers/interfaces/worker-response.interface';

export class WorkerResponseDto {
  constructor(data: Partial<WorkerResponseDto>) {
    Object.assign(this, data);
  }

  @Expose()
  @ApiProperty({ description: 'Unique identifier of the worker' })
  @IsUUID()
  @IsNotEmpty()
  readonly id!: string;

  @Expose()
  @ApiProperty({ description: 'Full name of the worker' })
  @IsNotEmpty()
  readonly fullName!: string;

  static fromDomain(data: IWorkerResponse): WorkerResponseDto {
    return new WorkerResponseDto({
      id: data.id,
      fullName: data.fullName,
    });
  }

  toDomain(): IWorkerResponse {
    return {
      id: this.id,
      fullName: this.fullName,
    };
  }
}
