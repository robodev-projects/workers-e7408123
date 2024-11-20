import { ICreateWorkerRequest } from 'src/modules/workers/interfaces/create-worker-request.interface';
import { IWorkerEntity } from 'src/modules/workers/interfaces/worker-entity.interface';
import { IWorkerResponse } from 'src/modules/workers/interfaces/worker-response.interface';

export abstract class WorkerRepository {
  abstract createWorker(request: ICreateWorkerRequest): Promise<IWorkerResponse>;
  abstract getWorkerById(workerId: string): Promise<IWorkerEntity | undefined>;
}
