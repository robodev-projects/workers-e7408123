export interface IWorkerStatePairEntity {
  id: string;
  workerId: string;
  totalSeconds: number;
  assignedAt: Date;
  assignedWorkerStateId: string;
  unassignedAt?: Date;
  unassignedWorkerStateId?: string;
}
