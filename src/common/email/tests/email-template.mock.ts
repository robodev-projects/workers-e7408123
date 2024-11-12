import { Injectable } from '@nestjs/common';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

import { type IEmailData, type IEmailTemplate } from '../email.types';
import { RegisterEmailTemplate } from '../loader/email-template.decorator';

export class MyEmailTemplateParameters {
  @Expose()
  @IsString()
  code!: string;
}

export const MyEmailTemplate: IEmailTemplate = {
  name: 'MY_EMAIL_TEMPLATE',
  subject: 'Forgot Password: {{code}}',
  engine: 'html',
  html: `
    <p>This is your code: {{code}}.</p>
  `,
  text: `
    Click here do the thing: {{code}}
  `,
};

@Injectable()
export class MyTemplateProvider {
  @RegisterEmailTemplate({
    validate: MyEmailTemplateParameters,
    template: MyEmailTemplate,
  })
  passwordReset(data: IEmailData<MyEmailTemplateParameters>) {
    // This is a preprocessor that can modify the data before sending the email
    return data;
  }
}
