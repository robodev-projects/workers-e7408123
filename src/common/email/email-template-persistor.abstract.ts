import type { IEmailTemplate } from './email.types';

export abstract class EmailTemplatePersistor {
  public abstract findByName(name: string): Promise<IEmailTemplate | null>;
}
