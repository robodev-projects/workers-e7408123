import { type ModuleMetadata } from '@nestjs/common';

import { getConfigFactory } from '~common/config';

import { FcmPushNotificationConfig } from './fcm-push-notification.config';
import { FcmPushNotificationProvider } from './fcm-push-notification.provider';

export const FcmPushNotificationPlugin: ModuleMetadata = {
  providers: [getConfigFactory(FcmPushNotificationConfig), FcmPushNotificationProvider],
};
