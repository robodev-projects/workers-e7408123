import { type ModuleMetadata } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

import { EmailProvider } from '../email-provider.abstract';
import type { IEmailData, IEmailSendResponse } from '../email.types';

@Injectable()
export class NoOpEmailProvider implements EmailProvider {
  async send(): Promise<IEmailSendResponse> {
    return {
      messageId: 'no-op',
      response: undefined,
    };
  }

  public async preprocess(data: IEmailData): Promise<IEmailData> {
    return data;
  }
}

/**
 * Disable email provider by doing nothing on calls
 */
export const NoOpEmailProviderPlugin: ModuleMetadata = {
  providers: [{ provide: EmailProvider, useClass: NoOpEmailProvider }],
  exports: [EmailProvider],
};
