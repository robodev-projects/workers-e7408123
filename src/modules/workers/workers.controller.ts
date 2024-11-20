import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { AuthnIdentity, IAuthnIdentity } from '~common/authn';

import { AuthenticatedUser } from '~modules/user';
import { CreateWorkerRequestDto } from '~modules/workers/dtos/create-worker-request.dto';
import { WorkerResponseDto } from '~modules/workers/dtos/worker-response.dto';
import { WorkersUseCase } from '~modules/workers/workers.use-case';

@ApiTags('Workers')
@Controller('workers')
export class WorkersController {
  constructor(private readonly workersUseCase: WorkersUseCase) {}

  @Post('/')
  @AuthenticatedUser()
  @ApiOperation({ summary: 'Create a new worker' })
  async createWorker(@Body() createWorkerRequestDto: CreateWorkerRequestDto): Promise<WorkerResponseDto> {
    const workerResponse = await this.workersUseCase.createWorker(createWorkerRequestDto.toDomain());
    return WorkerResponseDto.fromDomain(workerResponse);
  }

  @Get('/:workerId')
  @AuthenticatedUser()
  @ApiOperation({ summary: 'Get worker details by ID' })
  async getWorkerDetails(@Param('workerId') workerId: string): Promise<WorkerResponseDto> {
    const workerResponse = await this.workersUseCase.getWorkerDetails(workerId);
    return WorkerResponseDto.fromDomain(workerResponse);
  }
}
