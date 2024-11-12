import { Module } from '@nestjs/common';

import { MediaModule } from '~common/media';
import { PushNotificationModule } from '~common/push-notifications';

import { RocketController } from './rocket.controller';
import { RocketPushNotificationService } from './rocket.push-notification.service';
import { RocketRepository } from './rocket.repository';
import { RocketService } from './rocket.service';

@Module({
  imports: [
    //
    MediaModule.forRoot(),
    PushNotificationModule.forRoot(),
  ],
  controllers: [RocketController],
  providers: [RocketService, RocketRepository, RocketPushNotificationService],
})
export class RocketModule {}
