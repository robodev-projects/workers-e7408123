import { Controller, Get, HttpStatus, Query, Res } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { CoreConfig } from '~common/core';

import { GoogleAuthnAuthnTokenDto } from './dtos/google-authn.authn-token.dto';
import { GoogleAuthorizationFlowTokenDto } from './dtos/google-authorization-flow-token.dto';
import { GoogleAuthnConfig } from './google-authn.config';
import { GoogleAuthnProvider } from './google-authn.provider';

@ApiTags('Authentication')
@Controller('auth/provider/google')
export class GoogleAuthnAuthorizationFlowController {
  constructor(
    private readonly googleAuthnProvider: GoogleAuthnProvider,
    private readonly googleAuthnConfig: GoogleAuthnConfig,
    private readonly coreConfig: CoreConfig,
  ) {}

  /**
   * Start the authentication flow
   *  - Redirect to Google login page and back
   */
  @Get('/login')
  @ApiResponse({ status: 200, description: 'Return login instructions', type: GoogleAuthorizationFlowTokenDto })
  @ApiResponse({ status: 302, description: 'Redirect to login URL' })
  getLoginUrl(@Res({ passthrough: true }) res: Response): void | GoogleAuthorizationFlowTokenDto {
    const loginUrl = this.googleAuthnProvider.getAuthorizationFlowUrl();
    if (res.req.get('Accept')?.includes('application/json')) {
      res.status(HttpStatus.OK);
      return GoogleAuthorizationFlowTokenDto.fromDomain({ url: loginUrl });
    } else {
      res.status(HttpStatus.FOUND).redirect(loginUrl);
    }
  }

  /**
   * Handle the callback from the authentication flow
   */
  @Get('/callback')
  @ApiResponse({ status: 200, description: 'Auth flow callback', type: GoogleAuthnAuthnTokenDto })
  @ApiResponse({ status: 302, description: 'Auth flow callback redirect' })
  async callback(
    @Query('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GoogleAuthnAuthnTokenDto | void> {
    const { accessToken, refreshToken, idToken } = await this.googleAuthnProvider.handleAuthorizationFlowCallback(code);

    if (res.req.get('Accept')?.includes('application/json')) {
      res.status(HttpStatus.OK);
      return GoogleAuthnAuthnTokenDto.fromDomain({ accessToken, refreshToken, idToken });
    } else {
      let url = this.googleAuthnConfig.authorizationFlowRedirectUrl || '/auth/callback';
      if (url.startsWith('/')) url = `${this.coreConfig.webBaseUrl}${url}`;
      res
        .status(HttpStatus.FOUND)
        .redirect(`${url}?accessToken=${accessToken}&refreshToken=${refreshToken}&idToken=${idToken}`);
    }
  }
}
