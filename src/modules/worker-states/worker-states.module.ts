import { Module } from '@nestjs/common';

import { WorkerStatePairService } from '~modules/worker-states/worker-state-pair.service';
import { WorkerStateService } from '~modules/worker-states/worker-state.service';
import { WorkersController } from '~modules/worker-states/workers.controller';
import { WorkersUseCase } from '~modules/worker-states/workers.use-case';
import { WorkersModule } from '~modules/workers/workers.module';

import { WorkerStatePairPostgresRepository } from './worker-state-pair.prisma-repository';
import { WorkerStatePairRepository } from './worker-state-pair.repository';
import { WorkerStatePostgresRepository } from './worker-state.prisma-repository';
import { WorkerStateRepository } from './worker-state.repository';

@Module({
  imports: [WorkersModule],
  controllers: [WorkersController],
  providers: [
    {
      provide: WorkerStateRepository,
      useClass: WorkerStatePostgresRepository,
    },
    {
      provide: WorkerStatePairRepository,
      useClass: WorkerStatePairPostgresRepository,
    },
    WorkerStateService,
    WorkerStatePairService,
    WorkersUseCase,
  ],
  exports: [WorkerStateService, WorkerStatePairService],
})
export class WorkerStatesModule {}
