import { Injectable } from '@nestjs/common';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

import { RegisterPushNotificationTemplate } from '../loader/push-notification.decorator';
import type { IPushNotificationMessage } from '../push-notification.types';

export class HelloUserTemplateParameters {
  @Expose()
  @IsString()
  name!: string;
}

@Injectable()
export class HelloUserTemplateService {
  @RegisterPushNotificationTemplate({
    template: {
      name: 'hello-user',
      notification: {
        title: 'Hello, {{name}}!',
      },
    },
    validate: HelloUserTemplateParameters,
  })
  helloUser(message: IPushNotificationMessage) {
    return message;
  }
}
