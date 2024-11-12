import { Injectable } from '@nestjs/common';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

import {
  IPushNotificationMessage,
  PushNotificationService,
  RegisterPushNotificationTemplate,
} from '~common/push-notifications';

export class HelloUserTemplateParameters {
  @Expose()
  @IsString()
  name!: string;
}

@Injectable()
export class RocketPushNotificationService {
  constructor(private readonly pushNotificationService: PushNotificationService) {}

  public async sendHelloUser(userId: string) {
    await this.pushNotificationService.sendMessagesTemplate(
      {
        resourceName: userId,
        notification: { title: 'Rocket List {{name}}', body: 'Listing rockets' },
      },
      'hello-user',

      { name: userId },
    );
  }

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
    // add more data to the message here

    return message;
  }
}
