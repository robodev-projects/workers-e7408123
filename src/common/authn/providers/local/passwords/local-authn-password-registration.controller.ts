import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthnTokenDto } from '~common/authn';

import { LocalAuthnPasswordRegistrationRequestDto } from './dtos/local-authn-password-registration-request.dto';
import { LocalAuthnPasswordService } from './local-authn-password.service';

@ApiTags('Authentication')
@Controller('auth/provider/local')
export class LocalAuthnPasswordRegistrationController {
  constructor(private readonly localAuthPasswordService: LocalAuthnPasswordService) {}

  /**
   * Register a new auth identity
   */
  @Post('/register')
  async register(@Body() body: LocalAuthnPasswordRegistrationRequestDto): Promise<AuthnTokenDto> {
    /**
     *  - public endpoint, probably should be rate limited or captcha protected
     */
    const tokens = await this.localAuthPasswordService.register(body);
    return AuthnTokenDto.fromDomain(tokens);
  }
}
