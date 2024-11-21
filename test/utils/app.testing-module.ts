import { INestApplication, type ModuleMetadata } from '@nestjs/common';
import { TestingModuleBuilder } from '@nestjs/testing';
import * as nock from 'nock';

import { AuthnModule } from '~common/authn';
import { PrismaAuthnPersistorPlugin } from '~common/authn/persistors/prisma';
import { HotwireAuthnPlugin } from '~common/authn/providers/hotwire';
import { EmailModule } from '~common/email';
import { PrismaEmailTemplatePlugin } from '~common/email/persistors/prisma';
import { NoOpEmailProviderPlugin } from '~common/email/providers/no-op';
import { LoggerModule } from '~common/logger';
import { MediaModule } from '~common/media';
import { PrismaMediaPersistorPlugin } from '~common/media/persistors/prisma';
import { PrismaMediaProviderPlugin } from '~common/media/providers/prisma';
import { PushNotificationModule } from '~common/push-notifications';
import { PrismaPushNotificationPlugin } from '~common/push-notifications/persistors/prisma';
import { QueueModule } from '~common/queues';
import { HotwireQueuePlugin } from '~common/queues/providers/hotwire';

import { PrismaEphemeralModule } from '~database/prisma/prisma.ephemeral.module';

import { MediaLibraryModule } from '~modules/media-library';
import { UserModule } from '~modules/user';
import { UserAccountModule } from '~modules/user/account';

import { requestPipes } from '~app.pipes';

import { createBaseTestingModule } from './base.testing-module';

export const AppTestingModule: () => ModuleMetadata = () => ({
  imports: [
    LoggerModule,
    PrismaEphemeralModule,

    AuthnModule.forRoot([PrismaAuthnPersistorPlugin, HotwireAuthnPlugin]),
    MediaModule.forRoot([PrismaMediaPersistorPlugin, PrismaMediaProviderPlugin], { global: true }),
    QueueModule.forRoot([HotwireQueuePlugin]),
    EmailModule.forRoot([PrismaEmailTemplatePlugin, NoOpEmailProviderPlugin], { global: true }),
    PushNotificationModule.forRoot([PrismaPushNotificationPlugin], { global: true }),

    MediaLibraryModule,
    UserModule,
    UserAccountModule,
  ],
});

/**
 * Prepare a testing application for e2e tests
 *  - Should mirror AppModule `src/app.module.ts`
 */
export async function createAppTestingModule(
  /**
   * Extra modules to inject into the testing app
   */
  plugins?: ModuleMetadata[] | ModuleMetadata,
  options?: {
    beforeCompile?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
    beforeInit?: (app: INestApplication<any>) => INestApplication<any>;
    network?: string[];
  },
): Promise<INestApplication> {
  /**
   * Disable network connections
   */
  if (Array.isArray(options?.network)) {
    nock.disableNetConnect();
    const hosts = ['localhost', '127.0.0.1', ...options.network];
    // todo docker connections ? prisma etc
    nock.enableNetConnect((host) => hosts.some((x: string) => host.includes(x)));
  }

  return createBaseTestingModule(
    [AppTestingModule(), ...(plugins ? (Array.isArray(plugins) ? plugins : [plugins]) : [])],
    {
      beforeCompile: options?.beforeCompile,
      beforeInit: (app) => {
        /**
         * Apply request pipes
         *  - turn off specific pipes with config
         */
        requestPipes(app);

        return options?.beforeInit ? options.beforeInit(app) : app;
      },
    },
  );
}
