import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthnIdentity, IAuthnIdentity } from '~common/authn';

import { AuthenticatedUser } from '~modules/user';
import { CreateStateDto } from '~modules/worker-states/dtos/create-state.dto';
import { StateListResponseDto } from '~modules/worker-states/dtos/state-list-response.dto';
import { StateResponseDto } from '~modules/worker-states/dtos/state-response.dto';
import { StateTimeListTimePairsResponseDto } from '~modules/worker-states/dtos/state-time-list-time-pairs-response.dto';
import { WorkersUseCase } from '~modules/worker-states/workers.use-case';

@ApiTags('Workers')
@Controller('workers')
export class WorkerStatesController {
  constructor(private readonly workersUseCase: WorkersUseCase) {}

  @Post('/:workerId/states')
  @AuthenticatedUser()
  @ApiOperation({ summary: 'Create a new worker state' })
  async createWorkerState(
    @AuthnIdentity() auth: IAuthnIdentity,
    @Param('workerId') workerId: string,
    @Body() createStateDto: CreateStateDto,
  ): Promise<StateResponseDto> {
    const stateResponse = await this.workersUseCase.createWorkerState(workerId, createStateDto.toDomain());
    return StateResponseDto.fromDomain(stateResponse);
  }

  @Get('/:workerId/states')
  @AuthenticatedUser()
  @ApiOperation({ summary: 'Get states of a worker' })
  async getWorkerStates(@Param('workerId') workerId: string): Promise<StateListResponseDto> {
    const stateListResponse = await this.workersUseCase.getWorkerStates(workerId);
    return StateListResponseDto.fromDomain(stateListResponse);
  }

  @Get('/:workerId/work-reports')
  @AuthenticatedUser()
  @ApiOperation({ summary: 'Get work reports of a worker within a specified date range' })
  async getWorkReports(
    @Param('workerId') workerId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<StateTimeListTimePairsResponseDto> {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const response = await this.workersUseCase.calculateTotalSecondsInRange(workerId, fromDate, toDate);
    return StateTimeListTimePairsResponseDto.fromDomain(response);
  }
}
