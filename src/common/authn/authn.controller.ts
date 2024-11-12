import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Authenticated, AuthnIdentity } from './authn.decoratos';
import type { IAuthnIdentity } from './authn.types';
import { AuthnIdentityDto } from './dtos/authn-identity.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthnController {
  /**
   * Get the current client's authn details
   */
  @Get()
  @Authenticated()
  async details(@AuthnIdentity() authUser: IAuthnIdentity): Promise<AuthnIdentityDto> {
    return AuthnIdentityDto.fromDomain(authUser);
  }
}
