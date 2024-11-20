import { IWorkerStatePairEntity } from 'src/modules/worker-states/interfaces/worker-state-pair-entity.interface';

export abstract class WorkerStatePairRepository {
  abstract createWorkerStatePair(
    workerId: string,
    assignedWorkerStateId: string,
    assignedAt: Date,
  ): Promise<IWorkerStatePairEntity>;
  abstract findLastOpenWorkerStatePair(workerId: string): Promise<IWorkerStatePairEntity | undefined>;
  abstract updateWorkerStatePair(
    pairId: string,
    totalSeconds: number,
    unassignedWorkerStateId: string,
    unassignedAt: Date,
  ): Promise<void>;
  abstract findWorkerStatePairsInRange(workerId: string, from: Date, to: Date): Promise<IWorkerStatePairEntity[]>;
  abstract findWorkerStatePairsStartingBeforeAndEndingInRange(
    workerId: string,
    from: Date,
    to: Date,
  ): Promise<IWorkerStatePairEntity[]>;
  abstract findWorkerStatePairsStartingInRangeAndEndingAfter(
    workerId: string,
    from: Date,
    to: Date,
  ): Promise<IWorkerStatePairEntity[]>;
  abstract findWorkerStatePairsStartingBeforeAndEndingAfterRange(
    workerId: string,
    from: Date,
    to: Date,
  ): Promise<IWorkerStatePairEntity[]>;
}
