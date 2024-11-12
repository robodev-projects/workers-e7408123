import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

import { Auth0AuthorizationFlowInstructions } from '../auth0-authn.types';

export class Auth0AuthorizationFlowTokenDto implements Auth0AuthorizationFlowInstructions {
  /**
   * URL to redirect the user to
   */
  @Expose()
  @IsString()
  url!: string;

  private constructor(data: Auth0AuthorizationFlowTokenDto) {
    Object.assign(this, data);
  }

  static fromDomain(props: Auth0AuthorizationFlowInstructions): Auth0AuthorizationFlowTokenDto {
    return new Auth0AuthorizationFlowTokenDto(props);
  }
}
