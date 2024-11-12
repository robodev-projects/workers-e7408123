import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthnTokenDto, AuthnTokenRequestDto } from '~common/authn';

import { LocalAuthnService } from './local-authn.service';

@ApiTags('Authentication')
@Controller('auth/provider/local/refresh')
export class LocalAuthnRefreshTokenController {
  constructor(private readonly localAuthnService: LocalAuthnService) {}

  /**
   * Get new access token
   */
  @Post()
  async accessToken(@Body() data: AuthnTokenRequestDto): Promise<AuthnTokenDto> {
    const tokens = await this.localAuthnService.accessToken(data.refreshToken);
    return AuthnTokenDto.fromDomain(tokens);
  }
}
