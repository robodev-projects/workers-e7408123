import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Authenticated, AuthnIdentity } from '../../../authn.decoratos';
import { IAuthnIdentity } from '../../../authn.types';
import { AuthnTokenDto } from '../../../dtos';
import { LocalAuthnPasswordChangeRequestDto } from './dtos/local-authn-password-change-request.dto';
import { LocalAuthnPasswordLoginRequestDto } from './dtos/local-authn-password-login-request.dto';
import { LocalAuthnPasswordService } from './local-authn-password.service';

@ApiTags('Authentication')
@Controller('auth/provider/local')
export class LocalAuthnPasswordController {
  constructor(private readonly localAuthnPasswordService: LocalAuthnPasswordService) {}

  /**
   * Login with username and password
   */
  @Post('/login')
  async register(@Body() body: LocalAuthnPasswordLoginRequestDto): Promise<AuthnTokenDto> {
    /**
     *  - public endpoint, probably should be rate limited or captcha protected
     */
    const response = await this.localAuthnPasswordService.login(body);
    return AuthnTokenDto.fromDomain(response);
  }

  /**
   * Change the password
   */
  @Authenticated()
  @Post('/password')
  async password(
    @Body() body: LocalAuthnPasswordChangeRequestDto,
    @AuthnIdentity() auth: IAuthnIdentity,
  ): Promise<void> {
    /**
     *  - any logged-in user can change the password
     *  - forgotten passwords should be handled by the magic-link flow
     *  - we could secure this by requiring the session age to be less than 10min
     */
    await this.localAuthnPasswordService.changePassword(auth.userId, body);
  }
}
