import type { ClassConstructor } from 'class-transformer';

import { IPaginatedListQuery, OrderItemDto } from '~common/http/pagination';

export interface IPushNotificationData {
  /**
   * Data payload
   *  passed as is to the device
   */
  data?: Record<string, any>;

  /**
   * Generic notification object that can be used by all providers
   */
  notification?: {
    title?: string;
    body?: string;
    imageUrl?: string;
  };
}

export interface IPushNotificationMessageBase extends IPushNotificationData {
  provider: string;
  providerOptions?: Record<string, any>;
}

export type IPushNotificationMessage = IPushNotificationMessageBase &
  ({ token: string | string[] } | { topic: string });

/**
 * Template data to expand the message data
 */
export interface IPushNotificationTemplateData {
  template?: string;
  templateValues?: Record<string, any>;
}

export interface IPushNotificationMessageResponse extends IPushNotificationMessageBase {
  token?: string | string[];
  topic?: string;

  response?: string;
  error?: any;

  /**
   * Token/topic is invalid
   */
  invalidToken?: boolean;
  invalidTopic?: boolean;
}

export interface IPushNotificationSubscriptionResponse {
  token: string;
  error?: any;

  /**
   * Token is invalid
   */
  invalidToken: boolean;
}

export interface IPushNotificationToken {
  id: string;
  resourceName: string;
  token: string;
  title?: string;
  provider: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface IPushNotificationTokenCreate {
  id?: string;
  resourceName: string;
  token: string;
  title?: string;
  provider: string;
  expiresAt?: Date;
}

export interface IPushNotificationTokenFilter {
  provider?: string;
}

export interface IPushNotificationTokenOrder {
  provider?: OrderItemDto;
  expiresAt?: OrderItemDto;
}

export interface IPushNotificationTokenPaginationQuery
  extends IPaginatedListQuery<IPushNotificationTokenFilter, IPushNotificationTokenOrder> {}

export const PUSH_NOTIFICATION_TEMPLATE = 'push-notification-template';

/**
 * Template data to expand the message data
 */
export interface IPushNotificationTemplate {
  name: string;

  notification?: {
    title?: string;
    body?: string;
    imageUrl?: string;
  };
}

/**
 * Template decorator options
 */
export interface IPushNotificationTemplateDecoratorOptions {
  /**
   * Default template
   */
  template: IPushNotificationTemplate;

  /**
   * Validation class using class-validator
   */
  validate?: ClassConstructor<object>;
}
