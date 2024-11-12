import { Injectable } from '@nestjs/common';
import crypto from 'crypto';

import { BadRequestException } from '~common/exceptions';
import { LoggerService } from '~common/logger';

import { IAuthnToken } from '../../../authn.types';
import { LocalAuthnService } from '../local-authn.service';
import { ILocalAuthnPasswordChangeRequest, ILocalAuthnPasswordRegistrationRequest } from '../local-authn.types';

@Injectable()
export class LocalAuthnPasswordService {
  constructor(
    private readonly logger: LoggerService,
    private readonly localAuthnService: LocalAuthnService,
  ) {}

  async register(data: ILocalAuthnPasswordRegistrationRequest): Promise<IAuthnToken> {
    const password = this.hashPassword(data.password);

    const identity = await this.localAuthnService.create({
      disabled: false,
      validated: false,
      email: data.email,
      password,
    });

    return this.localAuthnService.createTokens(identity);
  }

  async changePassword(userId: string, data: ILocalAuthnPasswordChangeRequest): Promise<void> {
    const password = this.hashPassword(data.password);

    await this.localAuthnService.update(
      { id: userId },
      {
        password,
      },
    );
  }

  async login(data: ILocalAuthnPasswordRegistrationRequest): Promise<IAuthnToken> {
    const identity = await this.localAuthnService.find({ email: data.email });
    if (!identity || !identity.password) {
      // no user or no password set, intentionally vague error
      if (!identity) this.logger.debug(`User not found: ${data.email}`);
      if (!data.password) this.logger.debug(`User password not set: ${data.email}`);
      throw new BadRequestException('Invalid email or password', 'invalid-credentials');
    }

    const valid = this.validatePassword(data.password, identity.password);

    if (!valid) {
      this.logger.debug(`Wrong password: ${data.email}`);
      throw new BadRequestException('Invalid email or password', 'invalid-credentials');
    }

    return this.localAuthnService.createTokens(identity);
  }

  public hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  public validatePassword(password: string, hash: string): boolean {
    if (!hash || !hash.includes(':')) {
      throw new Error('Invalid hash');
    }
    const [salt, key] = hash.split(':');
    const hashToCheck = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hashToCheck === key;
  }
}
