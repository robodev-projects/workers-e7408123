import { IWorkerStateEntity } from 'src/modules/worker-states/interfaces/worker-state-entity.interface';

import { ICreateState } from './interfaces/create-state.interface';

export abstract class WorkerStateRepository {
  abstract createWorkerState(workerId: string, create: ICreateState): Promise<IWorkerStateEntity>;
  abstract getWorkerStatesByWorkerId(workerId: string): Promise<IWorkerStateEntity[]>;
}
