import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Duration } from 'luxon';

import { CoreConfig } from '~common/core';

import { HttpHealthDto } from './http-health.dto';

@ApiTags('Healthcheck')
@Controller()
export class HttpHealthController {
  constructor(private coreConfig: CoreConfig) {}

  @Get('/')
  @Header('Cache-Control', 'no-cache, no-store')
  @ApiExcludeEndpoint()
  public async getStatus(): Promise<HttpHealthDto> {
    return HttpHealthDto.fromDomain({
      uptime: Duration.fromObject({ seconds: process.uptime() }).toHuman() || 'unknown',
      stage: this.coreConfig.stage,
      version: this.coreConfig.version,
      release: this.coreConfig.release,
      buildTime: this.coreConfig.buildTime,
    });
  }
}
