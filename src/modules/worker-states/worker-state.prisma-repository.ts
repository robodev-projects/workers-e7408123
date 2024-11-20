import { Injectable } from '@nestjs/common';
import { WorkerState } from '@prisma/client';
import { IWorkerStateEntity } from 'src/modules/worker-states/interfaces/worker-state-entity.interface';
import { WorkerStateRepository } from 'src/modules/worker-states/worker-state.repository';

import { PrismaService } from '~database/prisma';

@Injectable()
export class WorkerStatePostgresRepository implements WorkerStateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWorkerState(workerId: string, state: string): Promise<IWorkerStateEntity> {
    const workerState = await this.prisma.client.workerState.create({
      data: {
        workerId,
        state,
      },
    });
    return this.toDomain(workerState);
  }

  async getWorkerStatesByWorkerId(workerId: string): Promise<IWorkerStateEntity[]> {
    const workerStates = await this.prisma.client.workerState.findMany({
      where: { workerId },
    });
    return workerStates.map(this.toDomain);
  }

  private toDomain(workerState: WorkerState): IWorkerStateEntity {
    return {
      id: workerState.id,
      workerId: workerState.workerId,
      state: workerState.state,
      createdAt: workerState.createdAt,
    };
  }
}
