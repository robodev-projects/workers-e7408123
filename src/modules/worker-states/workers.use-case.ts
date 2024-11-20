import { Injectable } from '@nestjs/common';

import { NotFoundException } from '~common/exceptions';
import { LoggerService } from '~common/logger';

import { WorkerService } from '../workers/worker.service';
import { State } from './enums/state.enum';
import { ICreateState } from './interfaces/create-state.interface';
import { IStateListResponse } from './interfaces/state-list-response.interface';
import { IStateResponse } from './interfaces/state-response.interface';
import { IStateTimeListTimePairsResponse } from './interfaces/state-time-list-time-pairs-response.interface';
import { IStateTimePairResponse } from './interfaces/state-time-pair-response.interface';
import { WorkerStatePairService } from './worker-state-pair.service';
import { WorkerStateService } from './worker-state.service';

@Injectable()
export class WorkersUseCase {
  constructor(
    private readonly logger: LoggerService,
    private readonly workerStateService: WorkerStateService,
    private readonly workerStatePairService: WorkerStatePairService,
    private readonly workerService: WorkerService,
  ) {}

  async createWorkerState(workerId: string, input: ICreateState): Promise<IStateResponse> {
    // Step 1: Create the worker state
    const workerState = await this.workerStateService.createWorkerState(workerId, input);

    if (input.state === State.ASSIGNED) {
      // Step 2: If state is ASSIGNED, create a WorkerStatePair
      await this.workerStatePairService.createWorkerStatePair(workerId, workerState.id, workerState.createdAt);
    } else if (input.state === State.UNASSIGNED) {
      // Step 3: If state is UNASSIGNED, handle WorkerStatePair updates
      const lastOpenPair = await this.workerStatePairService.findLastOpenWorkerStatePair(workerId);

      if (lastOpenPair) {
        // const unassignedAt = new Date();
        const totalSeconds = Math.floor((workerState.createdAt.getTime() - lastOpenPair.assignedAt.getTime()) / 1000);

        await this.workerStatePairService.updateWorkerStatePair(
          lastOpenPair.id,
          totalSeconds,
          workerState.id,
          workerState.createdAt,
        );
      } else {
        this.logger.warn('No open WorkerStatePair found for UNASSIGNED state.');
      }
    }

    // Step 4: Return the response
    return {
      id: workerState.id,
      state: workerState.state,
      createdAt: workerState.createdAt.toISOString(),
    };
  }

  async getWorkerStates(workerId: string): Promise<IStateListResponse> {
    const workerStates = await this.workerStateService.getWorkerStatesByWorkerId(workerId);

    if (!workerStates || workerStates.length === 0) {
      throw new NotFoundException(`No states found for worker with ID: ${workerId}`);
    }

    const stateResponses: IStateResponse[] = workerStates.map((state) => ({
      id: state.id,
      state: state.state,
      createdAt: state.createdAt.toISOString(),
    }));

    return { states: stateResponses };
  }

  async calculateTotalSecondsInRange(workerId: string, from: Date, to: Date): Promise<IStateTimeListTimePairsResponse> {
    const inRangePairs = await this.workerStatePairService.findWorkerStatePairsInRange(workerId, from, to);
    const beforeAndInRangePairs = await this.workerStatePairService.findWorkerStatePairsStartingBeforeAndEndingInRange(
      workerId,
      from,
      to,
    );
    const inRangeAndAfterPairs = await this.workerStatePairService.findWorkerStatePairsStartingInRangeAndEndingAfter(
      workerId,
      from,
      to,
    );
    const beforeAndAfterRangePairs =
      await this.workerStatePairService.findWorkerStatePairsStartingBeforeAndEndingAfterRange(workerId, from, to);

    const timePairs: IStateTimePairResponse[] = [];
    let totalSeconds = 0;

    inRangePairs.forEach((pair) => {
      const seconds = pair.totalSeconds;
      timePairs.push({
        totalSeconds: seconds,
        startTime: pair.assignedAt,
        endTime: pair.unassignedAt!,
        cutStartTime: undefined,
        cutEndTime: undefined,
      });
      totalSeconds += seconds;
    });

    beforeAndInRangePairs.forEach((pair) => {
      const cutStartTime = from;
      const seconds = Math.floor((pair.unassignedAt!.getTime() - cutStartTime.getTime()) / 1000);
      timePairs.push({
        totalSeconds: seconds,
        startTime: pair.assignedAt,
        endTime: pair.unassignedAt!,
        cutStartTime: cutStartTime,
        cutEndTime: undefined,
      });
      totalSeconds += seconds;
    });

    inRangeAndAfterPairs.forEach((pair) => {
      const cutEndTime = to;
      const seconds = Math.floor((cutEndTime.getTime() - pair.assignedAt.getTime()) / 1000);
      timePairs.push({
        totalSeconds: seconds,
        startTime: pair.assignedAt,
        endTime: pair.unassignedAt!,
        cutStartTime: undefined,
        cutEndTime: cutEndTime,
      });
      totalSeconds += seconds;
    });

    beforeAndAfterRangePairs.forEach((pair) => {
      const cutStartTime = from;
      const cutEndTime = to;
      const seconds = Math.floor((cutEndTime.getTime() - cutStartTime.getTime()) / 1000);
      timePairs.push({
        totalSeconds: seconds,
        startTime: pair.assignedAt,
        endTime: pair.unassignedAt!,
        cutStartTime: cutStartTime,
        cutEndTime: cutEndTime,
      });
      totalSeconds += seconds;
    });

    return {
      timePairs,
      totalSeconds,
    };
  }
}
