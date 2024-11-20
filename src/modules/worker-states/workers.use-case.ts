import { Inject, Injectable } from '@nestjs/common';

import { NotFoundException, InternalServerErrorException } from '~common/exceptions';

import { WorkerService } from '../workers/worker.service';
import { State } from './enums/state.enum';
import { ICreateState } from './interfaces/create-state.interface';
import { IStateListResponse } from './interfaces/state-list-response.interface';
import { IStateResponse } from './interfaces/state-response.interface';
import {
  IStateTimeListTimePairsResponse,
  IStateTimePairResponse,
} from './interfaces/state-time-list-time-pairs-response.interface';
import { IWorkerStatePairEntity } from './interfaces/worker-state-pair-entity.interface';
import { WorkerStatePairService } from './worker-state-pair.service';
import { WorkerStateService } from './worker-state.service';

@Injectable()
export class WorkersUseCase {
  constructor(
    private readonly workerStateService: WorkerStateService,
    private readonly workerStatePairService: WorkerStatePairService,
    private readonly workerService: WorkerService,
  ) {}

  async createWorkerState(userId: string, input: ICreateState): Promise<IStateResponse> {
    try {
      // Step 1: Create the worker state
      const workerState = await this.workerStateService.createWorkerState(userId, input.state);

      if (input.state === State.ASSIGNED) {
        // Step 2: If state is ASSIGNED, create a WorkerStatePair
        await this.workerStatePairService.createWorkerStatePair(userId, workerState.id, workerState.createdAt);
      } else if (input.state === State.UNASSIGNED) {
        // Step 3: If state is UNASSIGNED, handle WorkerStatePair updates
        const lastOpenPair = await this.workerStatePairService.findLastOpenWorkerStatePair(userId);

        if (!lastOpenPair) {
          throw new NotFoundException('No open WorkerStatePair found for UNASSIGNED state.');
        }

        const unassignedAt = new Date();
        const totalSeconds = Math.floor((unassignedAt.getTime() - lastOpenPair.assignedAt.getTime()) / 1000);

        await this.workerStatePairService.updateWorkerStatePair(
          lastOpenPair.id,
          totalSeconds,
          workerState.id,
          unassignedAt,
        );
      }

      // Step 4: Return the response
      return {
        id: workerState.id,
        state: workerState.state,
        createdAt: workerState.createdAt.toISOString(),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create worker state',
        error instanceof Error ? error : undefined,
      );
    }
  }

  async getWorkerStates(workerId: string): Promise<IStateListResponse> {
    try {
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
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve worker states',
        error instanceof Error ? error : undefined,
      );
    }
  }

  async calculateTotalSecondsInRange(workerId: string, from: Date, to: Date): Promise<IStateTimeListTimePairsResponse> {
    try {
      const inRangePairs = await this.workerStatePairService.findWorkerStatePairsInRange(workerId, from, to);
      const beforeAndInRangePairs =
        await this.workerStatePairService.findWorkerStatePairsStartingBeforeAndEndingInRange(workerId, from, to);
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
          cutStartTime: pair.assignedAt,
          cutEndTime: pair.unassignedAt!,
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
          cutEndTime: pair.unassignedAt!,
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
          cutStartTime: pair.assignedAt,
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
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to calculate total seconds in range',
        error instanceof Error ? error : undefined,
      );
    }
  }
}
