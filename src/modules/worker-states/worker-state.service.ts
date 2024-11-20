import { Inject, Injectable } from '@nestjs/common';
import { IWorkerStateEntity } from 'src/modules/worker-states/interfaces/worker-state-entity.interface';
import { WorkerStateRepository } from 'src/modules/worker-states/worker-state.repository';

import { InternalServerErrorException } from '~common/exceptions';
import { LoggerService } from '~common/logger';

@Injectable()
export class WorkerStateService {
  constructor(
    private readonly logger: LoggerService,
    @Inject(WorkerStateRepository)
    private readonly workerStateRepository: WorkerStateRepository,
  ) {}

  async createWorkerState(workerId: string, state: string): Promise<IWorkerStateEntity> {
    try {
      const workerState = await this.workerStateRepository.createWorkerState(workerId, state);
      return workerState;
    } catch (error) {
      this.logger.error('Failed to create worker state', { workerId, state, error });
      throw new InternalServerErrorException('Failed to create worker state');
    }
  }

  async getWorkerStatesByWorkerId(workerId: string): Promise<IWorkerStateEntity[]> {
    try {
      return await this.workerStateRepository.getWorkerStatesByWorkerId(workerId);
    } catch (error) {
      this.logger.error('Failed to retrieve worker states', { workerId, error });
      throw new InternalServerErrorException('Failed to retrieve worker states');
    }
  }
}
