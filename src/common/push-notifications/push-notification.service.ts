import { Injectable } from '@nestjs/common';

import { BadRequestException } from '~common/exceptions';
import { IPaginatedList } from '~common/http/pagination';
import { LoggerService } from '~common/logger';
import { plainToValidatedInstance } from '~common/validate';

import { PushNotificationLoader } from './loader/push-notification.loader';
import { PushNotificationPersistor } from './push-notification-persistor.abstract';
import { PushNotificationError } from './push-notification.exceptions';
import type {
  IPushNotificationData,
  IPushNotificationMessage,
  IPushNotificationMessageResponse,
  IPushNotificationTemplateData,
  IPushNotificationToken,
  IPushNotificationTokenPaginationQuery,
} from './push-notification.types';

@Injectable()
export class PushNotificationService {
  constructor(
    private readonly logger: LoggerService,
    private readonly pushNotificationPersistor: PushNotificationPersistor,
    private readonly loader: PushNotificationLoader,
  ) {}

  /**
   * Send message to a resource
   *  - resolve providers/topics and send potentially many messages
   */
  public async sendMessages(
    message: IPushNotificationData &
      IPushNotificationTemplateData & {
        /**
         * Resolve the destination via the resource name
         */
        resourceName?: string;

        /**
         * Resolve destination via tokens
         */
        tokens?: string[];

        /**
         * Providers and targets have different interfaces
         *  it is impossible to create a common interface for all of them
         *  use the following object to pass provider specific data
         *
         *  @example
         *   {
         *     fcm: { notification: { body: 'A longer message' } }
         *   }
         */
        providerOptions?: Record<string, Record<string, any>>;
      },
  ): Promise<IPushNotificationMessageResponse[]> {
    const messages: Array<IPushNotificationMessage & IPushNotificationTemplateData> = [];

    const providerTokens: Record<string, string[]> = {};

    if (message.tokens) {
      for (const { token, provider } of await this.pushNotificationPersistor.listToken({
        where: { token: message.tokens },
        take: message.tokens.length,
      })) {
        if (!providerTokens[provider]) providerTokens[provider] = [];
        providerTokens[provider].push(token);
      }
    }

    if (message.resourceName) {
      let results;
      let i = 0;
      do {
        results = await this.listToken({
          where: { resourceName: message.resourceName },
          take: 50,
          skip: i * 50,
        });
        for (const { token, provider } of results) {
          if (!providerTokens[provider]) providerTokens[provider] = [];
          providerTokens[provider].push(token);
        }
        i++;
      } while (results.length > 49);
    }

    for (const [provider, tokens] of Object.entries(providerTokens)) {
      messages.push({
        token: tokens,
        data: message.data,
        notification: message.notification,
        providerOptions: message.providerOptions?.[provider],
        template: message.template,
        templateValues: message.templateValues,
        provider,
      });
    }

    return await Promise.all(messages.map((m) => this.sendMessage(m))).then((r) => r.flat());
  }

  public async sendMessagesTemplate<T extends Record<string, any>>(
    message: IPushNotificationData & {
      resourceName?: string;
      tokens?: string[];
      providerOptions?: Record<string, Record<string, any>>;
    },
    template: string,
    templateValues: T,
  ) {
    return this.sendMessages({ ...message, template, templateValues });
  }

  /**
   * Send a message to a known provider with a topic/token
   */
  public async sendMessage(
    message: IPushNotificationMessage & IPushNotificationTemplateData,
  ): Promise<IPushNotificationMessageResponse[]> {
    if (!this.loader.providers[message.provider]) {
      this.logger.error(`Push notification provider ${message.provider} not found`);
      return [];
    }

    let response;
    let _message = message;

    if (message.template) {
      /**
       * Load the message from the template
       */
      const template = this.loader.templates[message.template];

      if (!template) {
        throw new PushNotificationError(`Template '${message.template}' not found`);
      }

      let templateValues = message.templateValues || {};
      if (template.templateOptions.validate) {
        templateValues = plainToValidatedInstance(template.templateOptions.validate, templateValues);
      }
      _message = await template.templateFunction({ ...message, templateValues });

      /**
       * Render template
       */
      if (template.templateOptions.template) {
        const notificationTemplate = template.templateOptions.template.notification;
        if (notificationTemplate) {
          if (!_message.notification) _message.notification = {};
          for (const field of ['title', 'body', 'imageUrl'] as const) {
            if (notificationTemplate[field]) {
              _message.notification[field] = this.replaceTemplateValues(notificationTemplate[field], templateValues);
            }
          }
        }
      }
    }

    try {
      response = await this.loader.providers[message.provider].sendMessage(_message);
    } catch (error) {
      return [
        {
          ...message,
          error,
        },
      ];
    }

    const invalidTokens = response
      .filter((r) => r.invalidToken && typeof r.token === 'string')
      .map((r) => r.token) as string[];
    if (invalidTokens.length > 0) {
      await this.pushNotificationPersistor.deleteToken({ token: invalidTokens });
    }

    return response;
  }

  public async listToken(options: {
    where: {
      id?: string | string[];
      resourceName?: string | string[];
      token?: string | string[];
      provider?: string | string[];
      expiresAt__lt?: Date;
    };
    skip?: number;
    take?: number;
  }) {
    return this.pushNotificationPersistor.listToken(options);
  }

  public async paginateToken(
    query: IPushNotificationTokenPaginationQuery & { filter: { resourceName?: string } },
  ): Promise<IPaginatedList<IPushNotificationToken>> {
    return this.pushNotificationPersistor.paginateToken(query);
  }

  public async registerToken(
    data: { resourceName: string; provider: string; token: string },
    options?: {
      // remove subscriptions for the token
      replace: boolean;
    },
  ) {
    if (options?.replace) {
      // remove old tokens if they exist
      await this.pushNotificationPersistor.deleteToken({
        token: data.token,
      });
    }

    if (!(data.provider in this.loader.providers)) {
      throw new BadRequestException(`Provider '${data.provider}' not found`);
    }

    // validate the token
    const token = await this.loader.providers[data.provider].validate(data);

    return await this.pushNotificationPersistor.createToken(token);
  }

  public async deleteToken(where: {
    id?: string | string[];
    token?: string | string[];
    resourceName?: string | string[];
    expiresAt__lt?: Date;
  }): Promise<number> {
    return this.pushNotificationPersistor.deleteToken(where);
  }

  private replaceTemplateValues(templateString: string, values: Record<string, any>): string {
    if (values && Object.keys(values).length > 0) {
      for (const [key, value] of Object.entries(values)) {
        templateString = templateString.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), `${value}`);
      }
    }
    return templateString;
  }
}
