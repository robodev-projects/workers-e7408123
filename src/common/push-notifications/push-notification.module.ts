import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { AuthnModule } from '~common/authn';
import { getConfig } from '~common/config';
import { deferComposableModule } from '~common/utils/nestjs';

import { PushNotificationLoader } from './loader/push-notification.loader';
import { PushNotificationTemplateMetadataAccessor } from './loader/push-notification.metadata-accessor';
import { PushNotificationConfig } from './push-notification.config';
import { PushNotificationController } from './push-notification.controller';
import { PushNotificationService } from './push-notification.service';

const pushNotificationConfig = getConfig(PushNotificationConfig);

@Module({})
export class PushNotificationModule {
  static forRoot = deferComposableModule({
    module: PushNotificationModule,
    imports: [
      //
      DiscoveryModule,

      AuthnModule.forRoot(),
    ],
    providers: [
      //
      PushNotificationService,
      PushNotificationLoader,
      PushNotificationTemplateMetadataAccessor,
    ],
    exports: [PushNotificationService],
    controllers: pushNotificationConfig.tokenController ? [PushNotificationController] : [],
  });
}
