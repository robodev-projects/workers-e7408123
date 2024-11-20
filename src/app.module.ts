import { Module } from '@nestjs/common';

import { AuthnModule } from '~common/authn';
import { PrismaAuthnPersistorPlugin } from '~common/authn/persistors/prisma';
import { LocalAuthnPlugin } from '~common/authn/providers/local';
import { LocalAuthnPasswordPlugin } from '~common/authn/providers/local/passwords';
import { PrismaLocalAuthnPersistorPlugin } from '~common/authn/providers/local/persistors/prisma';
import { EmailModule } from '~common/email';
import { PrismaEmailTemplatePlugin } from '~common/email/persistors/prisma';
import { NoOpEmailProviderPlugin } from '~common/email/providers/no-op';
import { HttpHealthModule } from '~common/http/health';
import { LoggerModule } from '~common/logger';
import { MediaModule } from '~common/media';
import { PrismaMediaPersistorPlugin } from '~common/media/persistors/prisma';
import { PrismaMediaProviderPlugin } from '~common/media/providers/prisma';
import { PushNotificationModule } from '~common/push-notifications';
import { PrismaPushNotificationPlugin } from '~common/push-notifications/persistors/prisma';
import { QueueModule } from '~common/queues';
import { HotwireQueuePlugin } from '~common/queues/providers/hotwire';

import { PrismaModule } from '~database/prisma';

import { MediaLibraryModule } from '~modules/media-library';
import { UserModule } from '~modules/user';
import { UserAccountModule } from '~modules/user/account';
import { UserDirectoryModule } from '~modules/user/directory';
import { WorkerStatesModule } from '~modules/worker-states/worker-states.module';
import { WorkersModule } from '~modules/workers/workers.module';

@Module({
  imports: [
    // common providers
    LoggerModule,
    PrismaModule,
    HttpHealthModule,

    AuthnModule.forRoot([
      PrismaAuthnPersistorPlugin,

      // local accounts
      LocalAuthnPlugin,
      PrismaLocalAuthnPersistorPlugin,
      LocalAuthnPasswordPlugin,
    ]),
    QueueModule.forRoot([HotwireQueuePlugin]),
    MediaModule.forRoot([PrismaMediaPersistorPlugin, PrismaMediaProviderPlugin], { global: true }),
    EmailModule.forRoot([NoOpEmailProviderPlugin, PrismaEmailTemplatePlugin], { global: true }),
    PushNotificationModule.forRoot([PrismaPushNotificationPlugin], { global: true }),

    UserModule,
    UserAccountModule,
    UserDirectoryModule,

    // controller-based modules
    MediaLibraryModule,
    WorkersModule,
    WorkerStatesModule,
  ],
})
export class AppModule {}
