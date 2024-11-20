import { Inject, Injectable } from '@nestjs/common';
import { IWorkerStateEntity } from 'src/modules/worker-states/interfaces/worker-state-entity.interface';
import { WorkerStateRepository } from 'src/modules/worker-states/worker-state.repository';

import { LoggerService } from '~common/logger';

import { ICreateState } from './interfaces/create-state.interface';

@Injectable()
export class WorkerStateService {
  constructor(
    private readonly logger: LoggerService,
    @Inject(WorkerStateRepository)
    private readonly workerStateRepository: WorkerStateRepository,
  ) {}

  async createWorkerState(workerId: string, create: ICreateState): Promise<IWorkerStateEntity> {
    const workerState = await this.workerStateRepository.createWorkerState(workerId, create);
    return workerState;
  }

  async getWorkerStatesByWorkerId(workerId: string): Promise<IWorkerStateEntity[]> {
    return await this.workerStateRepository.getWorkerStatesByWorkerId(workerId);
  }
}
