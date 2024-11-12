import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ApiPaginatedListResponse, PaginatedListDto } from '~common/http/pagination';

import { AuthenticatedUser } from '~modules/user';

import { RocketDto } from './dtos/rocket.dto';
import { RocketQueryDto } from './dtos/rocket.query.dto';
import { RocketService } from './rocket.service';

@ApiTags('Rocket')
@Controller('rockets')
export class RocketController {
  constructor(private readonly rocketService: RocketService) {}

  /**
   * List rockets
   */
  @Get('/')
  @AuthenticatedUser()
  @ApiPaginatedListResponse(RocketDto)
  async list(@Query() query: RocketQueryDto): Promise<PaginatedListDto<RocketDto>> {
    const rockets = await this.rocketService.paginate(query);
    rockets.items = await this.rocketService.resolveMedia(rockets.items);
    return PaginatedListDto.fromDomain(rockets, RocketDto.fromDomain);
  }
}
