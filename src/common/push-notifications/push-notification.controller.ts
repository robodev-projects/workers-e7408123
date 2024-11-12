import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Authenticated, AuthnIdentity, type IAuthnIdentity } from '~common/authn';
import { StatusResponseDto } from '~common/http/dtos';
import { PaginatedListDto } from '~common/http/pagination';

import { PushNotificationTokenCreateDto } from './dtos/push-notification-token.create.dto';
import { PushNotificationTokenDto } from './dtos/push-notification-token.dto';
import { IPushNotificationTokenPaginationQueryDto } from './dtos/push-notification-token.query';
import { PushNotificationService } from './push-notification.service';

@ApiTags('Push Notifications')
@Controller('push-notifications')
export class PushNotificationController {
  constructor(private readonly pushNotificationService: PushNotificationService) {}

  /**
   * Register/update a new device for push notifications
   */
  @Post()
  @Authenticated()
  async register(
    @AuthnIdentity() auth: IAuthnIdentity,
    @Body() data: PushNotificationTokenCreateDto,
  ): Promise<StatusResponseDto> {
    const created = await this.pushNotificationService.registerToken(
      {
        resourceName: auth.userId,
        provider: data.provider,
        token: data.token,
      },
      {
        replace: data.replace,
      },
    );
    return StatusResponseDto.fromDomain(created);
  }

  /**
   * Paginate push notification tokens
   */
  @Get()
  @Authenticated()
  async paginate(
    @AuthnIdentity() auth: IAuthnIdentity,
    @Query() data: IPushNotificationTokenPaginationQueryDto,
  ): Promise<PaginatedListDto<PushNotificationTokenDto>> {
    const tokens = await this.pushNotificationService.paginateToken({
      ...data,
      filter: { ...data.filter, resourceName: auth.userId },
    });
    return PaginatedListDto.fromDomain(tokens, PushNotificationTokenDto.fromDomain);
  }

  @Delete(':id')
  @Authenticated()
  async remove(
    @AuthnIdentity() auth: IAuthnIdentity,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StatusResponseDto> {
    const num = await this.pushNotificationService.deleteToken({ id, resourceName: auth.userId });
    return StatusResponseDto.fromDomain({ code: 'push-notification-tokens-removed', message: `${num} tokens removed` });
  }
}
