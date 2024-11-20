import { Injectable } from '@nestjs/common';
import { WorkerStatePair } from '@prisma/client';
import { IWorkerStatePairEntity } from 'src/modules/worker-states/interfaces/worker-state-pair-entity.interface';
import { WorkerStatePairRepository } from 'src/modules/worker-states/worker-state-pair.repository';

import { PrismaService } from '~database/prisma';

@Injectable()
export class WorkerStatePairPostgresRepository implements WorkerStatePairRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWorkerStatePair(
    workerId: string,
    assignedWorkerStateId: string,
    assignedAt: Date,
  ): Promise<IWorkerStatePairEntity> {
    const workerStatePair = await this.prisma.client.workerStatePair.create({
      data: {
        workerId,
        assignedWorkerStateId,
        assignedAt,
      },
    });
    return this.toDomain(workerStatePair);
  }

  async findLastOpenWorkerStatePair(workerId: string): Promise<IWorkerStatePairEntity | null> {
    const workerStatePair = await this.prisma.client.workerStatePair.findFirst({
      where: {
        workerId,
        unassignedAt: null,
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });
    return workerStatePair ? this.toDomain(workerStatePair) : null;
  }

  async updateWorkerStatePair(
    pairId: string,
    totalSeconds: number,
    unassignedWorkerStateId: string,
    unassignedAt: Date,
  ): Promise<void> {
    await this.prisma.client.workerStatePair.update({
      where: { id: pairId },
      data: {
        totalSeconds,
        unassignedWorkerStateId,
        unassignedAt,
      },
    });
  }

  async findWorkerStatePairsInRange(workerId: string, from: Date, to: Date): Promise<IWorkerStatePairEntity[]> {
    const workerStatePairs = await this.prisma.client.workerStatePair.findMany({
      where: {
        workerId,
        assignedAt: {
          gte: from,
        },
        OR: [
          {
            unassignedAt: {
              lte: to,
            },
          },
          {
            unassignedAt: null,
          },
        ],
      },
      orderBy: {
        assignedAt: 'asc',
      },
    });
    return workerStatePairs.map(this.toDomain);
  }

  async findWorkerStatePairsStartingBeforeAndEndingInRange(
    workerId: string,
    from: Date,
    to: Date,
  ): Promise<IWorkerStatePairEntity[]> {
    const workerStatePairs = await this.prisma.client.workerStatePair.findMany({
      where: {
        workerId,
        assignedAt: {
          lt: from,
        },
        unassignedAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: {
        assignedAt: 'asc',
      },
    });
    return workerStatePairs.map(this.toDomain);
  }

  async findWorkerStatePairsStartingInRangeAndEndingAfter(
    workerId: string,
    from: Date,
    to: Date,
  ): Promise<IWorkerStatePairEntity[]> {
    const workerStatePairs = await this.prisma.client.workerStatePair.findMany({
      where: {
        workerId,
        assignedAt: {
          gte: from,
          lte: to,
        },
        OR: [
          {
            unassignedAt: {
              gt: to,
            },
          },
          {
            unassignedAt: null,
          },
        ],
      },
      orderBy: {
        assignedAt: 'asc',
      },
    });
    return workerStatePairs.map(this.toDomain);
  }

  async findWorkerStatePairsStartingBeforeAndEndingAfterRange(
    workerId: string,
    from: Date,
    to: Date,
  ): Promise<IWorkerStatePairEntity[]> {
    const workerStatePairs = await this.prisma.client.workerStatePair.findMany({
      where: {
        workerId,
        assignedAt: {
          lt: from,
        },
        OR: [
          {
            unassignedAt: {
              gt: to,
            },
          },
          {
            unassignedAt: null,
          },
        ],
      },
      orderBy: {
        assignedAt: 'asc',
      },
    });
    return workerStatePairs.map(this.toDomain);
  }

  private toDomain(workerStatePair: WorkerStatePair): IWorkerStatePairEntity {
    return {
      id: workerStatePair.id,
      workerId: workerStatePair.workerId,
      totalSeconds: workerStatePair.totalSeconds ?? 0,
      assignedAt: workerStatePair.assignedAt,
      assignedWorkerStateId: workerStatePair.assignedWorkerStateId,
      unassignedAt: workerStatePair.unassignedAt ?? undefined,
      unassignedWorkerStateId: workerStatePair.unassignedWorkerStateId ?? undefined,
    };
  }
}
