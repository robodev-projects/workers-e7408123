import { Injectable } from '@nestjs/common';
import { Expose } from 'class-transformer';
import { IsBoolean, IsDate, IsString } from 'class-validator';

import { type IEmailTemplate, RegisterEmailTemplate, IEmailData } from '../../../../email';

export class LocalAuthnMagicLinkRequestEmailTemplateData {
  @Expose()
  @IsString()
  code!: string;

  @Expose()
  @IsDate()
  expiresIn!: string;

  /**
   * This is a new user
   */
  @Expose()
  @IsBoolean()
  created!: string;
}

export const LocalAuthnMagicLinkRequestEmailTemplate: IEmailTemplate = {
  name: 'AUTHN_MAGIC_LINK_EMAIL',
  engine: 'html',
  subject: 'Magic Link',
  html: `
    <p>Click <a href="{{url}}">here</a> to log in.</p>
    <p>This link will expire in {{expiresAt}}</p>
  `,
  text: 'Click here to log in',
};

@Injectable()
export class LocalAuthnMagicLinkEmailTemplates {
  @RegisterEmailTemplate({
    validate: LocalAuthnMagicLinkRequestEmailTemplateData,
    template: LocalAuthnMagicLinkRequestEmailTemplate,
  })
  async passwordResetTemplate(data: IEmailData<LocalAuthnMagicLinkRequestEmailTemplateData>): Promise<IEmailData> {
    return data;
  }
}
