import { Module, OnModuleDestroy } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { OpenTelemetryModule } from 'nestjs-otel';

import { getConfig } from '~common/config';

import { OtelConfig } from './otel.config';
import { shutdown } from './otel.instrument';
import { OtelInterceptor } from './otel.interceptor';

const otelConfig = getConfig(OtelConfig);

@Module({
  imports: [
    OpenTelemetryModule.forRoot({
      metrics: {
        hostMetrics: otelConfig.hostMetrics,
        apiMetrics: {
          enable: otelConfig.apiMetrics,
        },
      },
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: OtelInterceptor,
    },
  ],
})
export class OtelModule implements OnModuleDestroy {
  async onModuleDestroy() {
    await shutdown();
  }
}
