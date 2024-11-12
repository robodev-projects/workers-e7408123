import { Expose } from 'class-transformer';
import { IsDate, IsString } from 'class-validator';

import { IAuthnSession } from '../authn.types';

export class AuthnSessionDto {
  /**
   * Session ID
   */
  @Expose()
  @IsString()
  readonly sessionId!: string;

  /**
   * Name
   */
  @Expose()
  @IsDate()
  readonly createdAt!: Date;

  /**
   * User Agent
   */
  //@Expose()
  //@IsString()
  //readonly userAgent!: string;

  private constructor(data: AuthnSessionDto) {
    Object.assign(this, data);
  }

  static fromDomain(data: IAuthnSession): AuthnSessionDto {
    return new AuthnSessionDto({
      ...data,
      createdAt: new Date(data.createdAt * 1000),
    });
  }
}
