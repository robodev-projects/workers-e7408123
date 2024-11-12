import { SendEmailCommand, SendEmailCommandInput, SESClient } from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';

import { EmailProvider } from '../../email-provider.abstract';
import { EmailProviderSendError } from '../../email.exceptions';
import type { IEmailData, IEmailSendResponse } from '../../email.types';
import { AwsSesEmailConfig } from './aws-ses-email.config';

@Injectable()
export class AwsSesEmailProvider implements EmailProvider {
  constructor(private readonly sesConfig: AwsSesEmailConfig) {
    this.client = new SESClient({
      region: sesConfig.region,
      credentials:
        sesConfig.accessKeyId && sesConfig.secretAccessKey
          ? {
              accessKeyId: sesConfig.accessKeyId,
              secretAccessKey: sesConfig.secretAccessKey,
            }
          : undefined,
      endpoint: sesConfig.apiEndpoint,
    });
  }

  private readonly client: SESClient;

  async send(data: IEmailData): Promise<IEmailSendResponse> {
    /**
     * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-ses/Interface/SendEmailCommandInput/
     */
    const params: SendEmailCommandInput = {
      Source: data.from,

      Destination: {
        ToAddresses: Array.isArray(data.to) ? data.to : [data.to],
        CcAddresses: data.cc ? (Array.isArray(data.cc) ? data.cc : [data.cc]) : undefined,
        BccAddresses: data.bcc ? (Array.isArray(data.bcc) ? data.bcc : [data.bcc]) : undefined,
      },

      Message: {
        Subject: { Data: data.subject },
        Body: {
          Html: { Data: data.htmlContent },
          Text: { Data: data.textContent },
        },
      },

      ReplyToAddresses: data.replyTo ? (Array.isArray(data.replyTo) ? data.replyTo : [data.replyTo]) : undefined,

      // Return path for bounces and complaints
      // ReturnPath: this.emailProviderAwsSesConfig.returnPath,
      // ReturnPathArn: this.emailProviderAwsSesConfig.returnPathArn,

      // Mark email for tracking
      Tags: this.sesConfig.tags?.map((tag) => ({ Name: tag.name, Value: tag.value })),
    };

    // attachments, see SendRawEmailCommand
    // templates, see SendTemplatedEmailCommandInput

    const command = new SendEmailCommand(params);
    try {
      const response = await this.client.send(command);
      return {
        messageId: response.MessageId,
        response: response.$metadata,
      };
    } catch (error) {
      throw new EmailProviderSendError('Error Sending Email', { details: { data }, cause: error });
    }
  }

  /**
   * Preprocess email before template
   */
  public async preprocess(data: IEmailData): Promise<IEmailData> {
    return data;
  }
}
