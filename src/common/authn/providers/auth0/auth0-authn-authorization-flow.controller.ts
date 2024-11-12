import { Controller, Get, HttpStatus, Query, Res } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { CoreConfig } from '~common/core';

import { Auth0AuthnConfig } from './auth0-authn.config';
import { Auth0AuthnProvider } from './auth0-authn.provider';
import { Auth0AuthorizationFlowTokenDto } from './dtos/auth0-authorization-flow-instructions.dto';
import { Auth0AuthorizationFlowInstructionsDto } from './dtos/auth0-authorization-flow-token.dto';

@ApiTags('Authentication')
@Controller('auth/provider/auth0')
export class Auth0AuthnAuthorizationFlowController {
  constructor(
    private readonly auth0AuthnProvider: Auth0AuthnProvider,
    private readonly auth0AuthnConfig: Auth0AuthnConfig,
    private readonly coreConfig: CoreConfig,
  ) {}

  /**
   * Start the authentication flow
   */
  @Get('/login')
  getLoginUrl(): Auth0AuthorizationFlowTokenDto {
    return Auth0AuthorizationFlowTokenDto.fromDomain({ url: this.auth0AuthnProvider.getAuthorizationFlowUrl() });
  }

  @Get('/callback')
  @ApiResponse({ status: 200, description: 'Auth flow callback', type: Auth0AuthorizationFlowInstructionsDto })
  @ApiResponse({ status: 302, description: 'Auth flow callback redirect' })
  async callback(
    @Query('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Auth0AuthorizationFlowInstructionsDto | void> {
    const { access_token, id_token, token_type, refresh_token } =
      await this.auth0AuthnProvider.getAuthorizationFlowToken(code);

    if (res.req.get('Accept')?.includes('application/json')) {
      res.status(HttpStatus.OK);
      return Auth0AuthorizationFlowInstructionsDto.fromDomain({ access_token, id_token, token_type, refresh_token });
    } else {
      let url = this.auth0AuthnConfig.authorizationFlowRedirectUrl || '/auth/callback';
      if (url.startsWith('/')) url = `${this.coreConfig.webBaseUrl}${url}`;
      res
        .status(HttpStatus.FOUND)
        .redirect(
          `${url}?accessToken=${access_token}&refreshToken=${refresh_token}&idToken=${id_token}&tokenType=${token_type}`,
        );
    }
  }
}
