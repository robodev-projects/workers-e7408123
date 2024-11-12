import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';

import { IAuthnIdentity, AuthnIdentity, AuthnProviderIdentity, AuthnTokenDto } from '~common/authn';
import { AuthnTokenRequestDto, AuthnSessionDto } from '~common/authn/dtos';
import { StatusResponseDto } from '~common/http/dtos';
import { PaginatedListDto } from '~common/http/pagination';

import { AuthenticatedUser } from '../user.decorators';
import { UserSessionService } from './user-session.service';

@ApiTags('Account')
@Controller('account/session')
export class UserSessionController {
  constructor(private readonly accountService: UserSessionService) {}

  /**
   * Login
   */
  @Post()
  @AuthenticatedUser()
  async login(@AuthnProviderIdentity() auth: IAuthnIdentity): Promise<AuthnTokenDto> {
    const tokens = await this.accountService.login(auth);
    return AuthnTokenDto.fromDomain({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  }

  /**
   * Get new access token
   */
  @Post('refresh')
  async accessToken(@Body() data: AuthnTokenRequestDto): Promise<AuthnTokenDto> {
    const tokens = await this.accountService.accessToken(data.refreshToken);

    return AuthnTokenDto.fromDomain({
      accessToken: tokens.accessToken,
    });
  }

  /**
   * List active sessions
   */

  @Get()
  @AuthenticatedUser()
  @ApiExcludeEndpoint()
  async list(@AuthnIdentity() auth: IAuthnIdentity): Promise<PaginatedListDto<AuthnSessionDto>> {
    const sessions = await this.accountService.list(auth.userId);
    return PaginatedListDto.fromDomain(
      { items: sessions, totalItems: sessions.length, page: 1, limit: sessions.length },
      AuthnSessionDto.fromDomain,
    );
  }

  /**
   * Logout
   */
  @Delete(':sessionId?')
  @AuthenticatedUser()
  async logout(
    @AuthnIdentity() auth: IAuthnIdentity,
    @Param('sessionId') sessionId?: string,
  ): Promise<StatusResponseDto> {
    const done = await this.accountService.logout(auth.userId, sessionId);
    return StatusResponseDto.fromDomain({ status: done ? 'success' : 'done' });
  }
}
