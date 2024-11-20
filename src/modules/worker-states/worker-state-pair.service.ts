import { Inject, Injectable } from '@nestjs/common';
import { IWorkerStatePairEntity } from 'src/modules/worker-states/interfaces/worker-state-pair-entity.interface';
import { WorkerStatePairRepository } from 'src/modules/worker-states/worker-state-pair.repository';

import { LoggerService } from '~common/logger';

@Injectable()
export class WorkerStatePairService {
  constructor(
    private readonly logger: LoggerService,
    @Inject(WorkerStatePairRepository)
    private readonly workerStatePairRepository: WorkerStatePairRepository,
  ) {}

  async createWorkerStatePair(
    workerId: string,
    assignedWorkerStateId: string,
    assignedAt: Date,
  ): Promise<IWorkerStatePairEntity> {
    return await this.workerStatePairRepository.createWorkerStatePair(workerId, assignedWorkerStateId, assignedAt);
  }

  async findLastOpenWorkerStatePair(workerId: string): Promise<IWorkerStatePairEntity | undefined> {
    return await this.workerStatePairRepository.findLastOpenWorkerStatePair(workerId);
  }

  async updateWorkerStatePair(
    pairId: string,
    totalSeconds: number,
    unassignedWorkerStateId: string,
    unassignedAt: Date,
  ): Promise<void> {
    await this.workerStatePairRepository.updateWorkerStatePair(
      pairId,
      totalSeconds,
      unassignedWorkerStateId,
      unassignedAt,
    );
  }

  async findWorkerStatePairsInRange(workerId: string, from: Date, to: Date): Promise<IWorkerStatePairEntity[]> {
    return await this.workerStatePairRepository.findWorkerStatePairsInRange(workerId, from, to);
  }

  async findWorkerStatePairsStartingBeforeAndEndingInRange(
    workerId: string,
    from: Date,
    to: Date,
  ): Promise<IWorkerStatePairEntity[]> {
    return await this.workerStatePairRepository.findWorkerStatePairsStartingBeforeAndEndingInRange(workerId, from, to);
  }

  async findWorkerStatePairsStartingInRangeAndEndingAfter(
    workerId: string,
    from: Date,
    to: Date,
  ): Promise<IWorkerStatePairEntity[]> {
    const workerStatePairs = await this.workerStatePairRepository.findWorkerStatePairsStartingInRangeAndEndingAfter(
      workerId,
      from,
      to,
    );
    return workerStatePairs;
  }

  async findWorkerStatePairsStartingBeforeAndEndingAfterRange(
    workerId: string,
    from: Date,
    to: Date,
  ): Promise<IWorkerStatePairEntity[]> {
    const workerStatePairs = await this.workerStatePairRepository.findWorkerStatePairsStartingBeforeAndEndingAfterRange(
      workerId,
      from,
      to,
    );
    return workerStatePairs;
  }
}
