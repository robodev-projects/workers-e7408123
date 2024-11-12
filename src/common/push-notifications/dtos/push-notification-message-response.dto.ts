import { Expose, Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

import type { IPushNotificationMessageResponse } from '../push-notification.types';

export class PushNotificationMessageResponseDto {
  @Expose()
  @IsString({ each: true })
  @IsOptional()
  tokens?: string[];

  @Expose()
  @IsString()
  @IsOptional()
  response?: string;

  @Expose()
  @IsString()
  @IsOptional()
  error?: string;

  constructor(data: IPushNotificationMessageResponse) {
    return Object.assign(this, data);
  }
}

export class PushNotificationMessageResponsesDto {
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => PushNotificationMessageResponseDto)
  responses!: PushNotificationMessageResponseDto[];

  constructor(data: { responses: PushNotificationMessageResponseDto[] }) {
    return Object.assign(this, data);
  }

  static fromDomain(data: { responses: IPushNotificationMessageResponse[] }): PushNotificationMessageResponsesDto {
    return new PushNotificationMessageResponsesDto({
      responses: data.responses.map((r) => ({
        ...r,
        tokens: Array.isArray(r.token) ? r.token : r.token ? [r.token] : undefined,
      })),
    });
  }
}
