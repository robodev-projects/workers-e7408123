import { Injectable } from '@nestjs/common';
import { MailDataRequired, MailService } from '@sendgrid/mail';

import { EmailProvider } from '../../email-provider.abstract';
import { EmailProviderSendError } from '../../email.exceptions';
import type { IEmailData, IEmailSendResponse } from '../../email.types';
import { stringToEmailJson } from '../../transformers/email-json.transform';
import { SendgridEmailConfig } from './sendgrid-email.config';

@Injectable()
export class SendgridEmailProvider implements EmailProvider {
  private readonly mailService: MailService;

  constructor(private readonly sendgridEmailConfig: SendgridEmailConfig) {
    this.mailService = new MailService();
    this.mailService.setApiKey(sendgridEmailConfig.apiKey);
  }

  async send(data: IEmailData): Promise<IEmailSendResponse> {
    const message: MailDataRequired = {
      from: data.from,

      to: data.to,
      cc: data.cc,
      bcc: data.bcc,

      subject: data.subject!,
      html: data.htmlContent!,
      text: data.textContent!,

      // send email using sendgrid template
      // templateId
      // dynamicTemplateData

      // attachments
    };

    if (data.template) {
      message.templateId = data.template;
      message.dynamicTemplateData = data.templateValues;
    }

    if (data.replyTo) {
      if (Array.isArray(data.replyTo)) {
        message.replyToList = data.replyTo.map(stringToEmailJson);
      } else {
        message.replyTo = data.replyTo;
      }
    }

    if (Array.isArray(data.to) && data.to.length > 1) {
      // send multiple emails, recipient do not see each other
      message.isMultiple = true;
    }

    try {
      const response = await this.mailService.send(message);
      return {
        // todo, check if this is the correct messageId
        messageId: response[0]?.headers['x-message-id'],
        response,
      };
    } catch (error) {
      throw new EmailProviderSendError('Error sending email', { details: { data }, cause: error });
    }
  }

  /**
   * Preprocess email before template
   */
  public async preprocess(data: IEmailData): Promise<IEmailData> {
    if (data.template) {
      const template = this.sendgridEmailConfig.templates?.find((template) => template.name === data.template);
      if (template) {
        data.template = template.id;
        data.templateOptions = { ...(data.templateOptions ?? {}), enabled: false };
      }
    }
    return data;
  }
}
