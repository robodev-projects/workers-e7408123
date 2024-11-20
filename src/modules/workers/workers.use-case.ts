import { Inject, Injectable } from '@nestjs/common';
import { ICreateWorkerRequest } from 'src/modules/workers/interfaces/create-worker-request.interface';
import { IWorkerResponse } from 'src/modules/workers/interfaces/worker-response.interface';
import { WorkerService } from 'src/modules/workers/worker.service';

import { NotFoundException } from '~common/exceptions';

@Injectable()
export class WorkersUseCase {
  constructor(private readonly workerService: WorkerService) {}

  async createWorker(request: ICreateWorkerRequest): Promise<IWorkerResponse> {
    try {
      const workerResponse = await this.workerService.createWorker(request);
      return workerResponse;
    } catch (error) {
      // Handle exceptions if necessary, for now, we just rethrow
      throw error;
    }
  }

  async getWorkerDetails(workerId: string): Promise<IWorkerResponse> {
    try {
      const workerEntity = await this.workerService.getWorkerById(workerId);
      if (!workerEntity) {
        throw new NotFoundException(`Worker with id ${workerId} not found`);
      }
      const workerResponse: IWorkerResponse = {
        id: workerEntity.id,
        fullName: workerEntity.fullName,
      };
      return workerResponse;
    } catch (error) {
      // Handle exceptions if necessary, for now, we just rethrow
      throw error;
    }
  }
}
