import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

import type { Job } from '../../queue.types';

export class QueueJobCreateResponseDto {
  @Expose()
  @IsString()
  id!: string | number;

  constructor(data: QueueJobCreateResponseDto) {
    Object.assign(this, data);
  }

  static fromDomain(domain: Job<any>): QueueJobCreateResponseDto {
    return new QueueJobCreateResponseDto({ id: domain.id! });
  }
}
