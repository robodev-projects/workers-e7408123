import { Controller, Get, HttpStatus, Query, Res } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { CoreConfig } from '~common/core';
import { StatusResponseDto } from '~common/http/dtos';

import { Authenticated } from '../../../authn.decoratos';
import { AuthnTokenDto } from '../../../dtos/authn-token.dto';
import { LocalAuthnConfig } from '../local-authn.config';
import { LocalAuthnMagicLinkService } from './local-authn-magic-link.service';

@ApiTags('Authentication')
@Controller('auth/provider/local/magic-link')
export class LocalAuthnMagicLinkController {
  constructor(
    private readonly localAuthnMagicLinkService: LocalAuthnMagicLinkService,
    private readonly localAuthnConfig: LocalAuthnConfig,
    private readonly coreConfig: CoreConfig,
  ) {}

  /**
   * Request a new magic link
   */
  @Get('/request')
  async requestEmail(@Query('email') email: string): Promise<StatusResponseDto> {
    /**
     *  - public endpoint, probably should be rate limited or captcha protected
     */
    const response = await this.localAuthnMagicLinkService.requestEmail({ email });
    return StatusResponseDto.fromDomain({ message: response.message });
  }

  /**
   * Magic link callback
   */
  @Authenticated()
  @Get('/callback')
  @ApiResponse({ status: 200, description: 'Magic link callback', type: AuthnTokenDto })
  @ApiResponse({ status: 302, description: 'Magic link redirect' })
  async password(
    @Query('code') code: string,
    @Query('email') email: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthnTokenDto | void> {
    const { accessToken } = await this.localAuthnMagicLinkService.handleCallback({ email, code });

    if (res.req.get('Accept')?.includes('application/json')) {
      res.status(HttpStatus.OK);
      return AuthnTokenDto.fromDomain({ accessToken });
    } else {
      let url = this.localAuthnConfig?.magicLinks?.registrationRedirect || '/auth/callback';
      if (url.startsWith('/')) url = `${this.coreConfig.webBaseUrl}${url}`;

      res.status(HttpStatus.FOUND).redirect(`${url}?accessToken=${accessToken}`);
    }
  }
}
