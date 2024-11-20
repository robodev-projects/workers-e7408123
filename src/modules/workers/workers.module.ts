import { Module } from '@nestjs/common';

import { WorkerService } from '~modules/workers/worker.service';
import { WorkersController } from '~modules/workers/workers.controller';
import { WorkersUseCase } from '~modules/workers/workers.use-case';

import { WorkerPostgresRepository } from './worker.prisma-repository';
import { WorkerRepository } from './worker.repository';

@Module({
  controllers: [WorkersController],
  providers: [
    {
      provide: WorkerRepository,
      useClass: WorkerPostgresRepository,
    },
    WorkerService,
    WorkersUseCase,
  ],
  exports: [WorkerService],
})
export class WorkersModule {}
