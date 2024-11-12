import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

import { CoreConfig } from '~common/core';
import { EmailService } from '~common/email';
import { BadRequestException } from '~common/exceptions';
import { LoggerService } from '~common/logger';
import { makeUUID } from '~common/utils/short-uuid';

import { IAuthnToken } from '../../../authn.types';
import { LocalAuthnConfig } from '../local-authn.config';
import { LocalAuthnService } from '../local-authn.service';
import { ILocalAuthnMagicLinkRequest } from '../local-authn.types';
import { LocalAuthnMagicLinkRequestEmailTemplate } from './local-authn-magic-link.email-template';

@Injectable()
export class LocalAuthnMagicLinkService {
  constructor(
    private readonly logger: LoggerService,
    private readonly localAuthnConfig: LocalAuthnConfig,
    private readonly localAuthnService: LocalAuthnService,
    private readonly coreConfig: CoreConfig,
    private readonly emailService: EmailService,
  ) {}

  async requestEmail(data: ILocalAuthnMagicLinkRequest): Promise<{ message: string }> {
    const localIdentity = await this.localAuthnService.find({ email: data.email });

    const secret = makeUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
    let created = false;

    if (!localIdentity) {
      if (this.localAuthnConfig.magicLinks?.registration) {
        // registration is enabled, register the user
        await this.localAuthnService.create({
          email: data.email,
          magicLinkCode: secret,
          magicLinkCodeExpiresAt: expiresAt,
        });
        created = true;
      } else {
        // return ok to be vague
        this.logger.debug(`Email does not exist: ${data.email}`);
        return { message: 'If the email exists, you will get an email soon' };
      }
    } else {
      // send email to existing user
      await this.localAuthnService.update(
        { email: data.email },
        {
          magicLinkCode: secret,
          magicLinkCodeExpiresAt: expiresAt,
        },
      );
    }

    await this.emailService.sendTemplate({ to: data.email }, LocalAuthnMagicLinkRequestEmailTemplate.name, {
      url: `${this.coreConfig.apiBaseUrl}auth/provider/local/callback?email=${data.email}&code=${secret}`,
      expiresIn: DateTime.fromJSDate(expiresAt).toRelative(),
      created,
    });

    return { message: 'If the email address exists, you will get an email soon' };
  }

  async handleCallback(data: { email: string; code: string }): Promise<IAuthnToken> {
    if (!data.email || !data.code) {
      throw new BadRequestException('No email or code in request');
    }

    const identity = await this.localAuthnService.find({ email: data.email });

    if (
      !identity ||
      !identity.magicLinkCode ||
      !identity.magicLinkCodeExpiresAt ||
      identity.magicLinkCode !== data.code
    ) {
      // no user, or no magic link, intentionally vague error
      if (!identity) this.logger.debug(`User not found: ${data.email}`);
      else if (!identity.magicLinkCode) this.logger.debug(`User magic link not set: ${data.email}`);
      else if (identity.magicLinkCode !== data.code) this.logger.debug(`User magic link does not match: ${data.email}`);
      throw new BadRequestException('Invalid email or code');
    }

    // code is valid, but may be expired, we can tell that
    if (DateTime.fromJSDate(identity.magicLinkCodeExpiresAt).diffNow().milliseconds < 0) {
      throw new BadRequestException('Magic link is expired');
    }

    return this.localAuthnService.createTokens(identity);
  }
}
