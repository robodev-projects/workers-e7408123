import { IWorkerStateEntity } from 'src/modules/worker-states/interfaces/worker-state-entity.interface';

export abstract class WorkerStateRepository {
  abstract createWorkerState(workerId: string, state: string): Promise<IWorkerStateEntity>;
  abstract getWorkerStatesByWorkerId(workerId: string): Promise<IWorkerStateEntity[]>;
}
