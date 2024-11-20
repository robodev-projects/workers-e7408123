import { Inject, Injectable } from '@nestjs/common';
import { ICreateWorkerRequest } from 'src/modules/workers/interfaces/create-worker-request.interface';
import { IWorkerEntity } from 'src/modules/workers/interfaces/worker-entity.interface';
import { IWorkerResponse } from 'src/modules/workers/interfaces/worker-response.interface';
import { WorkerRepository } from 'src/modules/workers/worker.repository';

import { InternalServerErrorException } from '~common/exceptions/internal-server-error.exception';
import { NotFoundException } from '~common/exceptions/not-found.exception';
import { LoggerService } from '~common/logger';

@Injectable()
export class WorkerService {
  constructor(
    private readonly logger: LoggerService,
    @Inject(WorkerRepository) private readonly workerRepository: WorkerRepository,
  ) {}

  async createWorker(request: ICreateWorkerRequest): Promise<IWorkerResponse> {
    const workerResponse = await this.workerRepository.createWorker(request);
    if (!workerResponse) {
      throw new InternalServerErrorException('Failed to create worker.', 'WORKER_CREATION_FAILED');
    }
    return workerResponse;
  }

  async getWorkerById(workerId: string): Promise<IWorkerEntity> {
    const worker = await this.workerRepository.getWorkerById(workerId);
    if (!worker) {
      throw new NotFoundException('Worker not found.', 'WORKER_NOT_FOUND');
    }
    return worker;
  }
}
