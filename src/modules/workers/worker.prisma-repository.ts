import { Injectable } from '@nestjs/common';
import { Worker } from '@prisma/client';
import { ICreateWorkerRequest } from 'src/modules/workers/interfaces/create-worker-request.interface';
import { IWorkerEntity } from 'src/modules/workers/interfaces/worker-entity.interface';
import { IWorkerResponse } from 'src/modules/workers/interfaces/worker-response.interface';
import { WorkerRepository } from 'src/modules/workers/worker.repository';

import { PrismaService } from '~database/prisma';

@Injectable()
export class WorkerPostgresRepository implements WorkerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWorker(request: ICreateWorkerRequest): Promise<IWorkerResponse> {
    const worker = await this.prisma.client.worker.create({
      data: {
        fullName: request.fullName,
      },
    });
    return this.toResponseDomain(worker);
  }

  async getWorkerById(workerId: string): Promise<IWorkerEntity | undefined> {
    const worker = await this.prisma.client.worker.findUnique({
      where: { id: workerId },
    });
    return worker ? this.toEntityDomain(worker) : undefined;
  }

  private toResponseDomain(worker: Worker): IWorkerResponse {
    return {
      id: worker.id,
      fullName: worker.fullName,
    };
  }

  private toEntityDomain(worker: Worker): IWorkerEntity {
    return {
      id: worker.id,
      fullName: worker.fullName,
      createdAt: worker.createdAt,
    };
  }
}
