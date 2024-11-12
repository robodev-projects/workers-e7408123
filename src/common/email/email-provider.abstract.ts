import type { IEmailData, IEmailSendResponse, IEmailTemplatedData } from './email.types';

export abstract class EmailProvider {
  abstract send(data: IEmailData): Promise<IEmailSendResponse>;
  abstract preprocess(data: IEmailTemplatedData): Promise<IEmailTemplatedData>;
}
