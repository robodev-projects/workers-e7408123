import { type ModuleMetadata } from '@nestjs/common';

import { PushNotificationPersistor } from '../../push-notification-persistor.abstract';
import { PrismaPushNotificationPersistor } from './prisma-push-notification.persistor';

/**
 * Store push notification tokens using Prisma
 */
export const PrismaPushNotificationPlugin: ModuleMetadata = {
  providers: [{ provide: PushNotificationPersistor, useClass: PrismaPushNotificationPersistor }],
};
