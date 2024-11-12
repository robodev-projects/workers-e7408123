import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

import { IGoogleAuthorizationFlowInstructions } from '../google-authn.types';

export class GoogleAuthorizationFlowTokenDto implements IGoogleAuthorizationFlowInstructions {
  /**
   * URL to redirect the user to
   */
  @Expose()
  @IsString()
  url!: string;

  private constructor(data: GoogleAuthorizationFlowTokenDto) {
    Object.assign(this, data);
  }

  static fromDomain(props: IGoogleAuthorizationFlowInstructions): GoogleAuthorizationFlowTokenDto {
    return new GoogleAuthorizationFlowTokenDto(props);
  }
}
