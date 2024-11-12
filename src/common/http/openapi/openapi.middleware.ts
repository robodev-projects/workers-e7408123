import { INestApplication } from '@nestjs/common';
import { Request, Response } from 'express';
import { readFileSync } from 'fs';
import { resolve } from 'node:path';

import { getConfig } from '~common/config';

import { OpenApiConfig, OpenApiConfigMode } from './openapi.config';
import { useSwagger } from './openapi.helpers';

const openApiConfig = getConfig(OpenApiConfig);

export function setupOpenApi(app: INestApplication) {
  if (openApiConfig.mode === OpenApiConfigMode.runtime) {
    useSwagger(app);
  } else if (openApiConfig.mode === OpenApiConfigMode.static) {
    app.use(`/${openApiConfig.path}-json`, (_req: Request, res: Response) => {
      res.json(JSON.parse(readFileSync(resolve(__dirname, '../../../../', 'resources', 'openapi.json'), 'utf-8')));
    });
  }
}
