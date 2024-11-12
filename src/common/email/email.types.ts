export interface IEmailPartialData {
  /**
   * Recipient email address
   */
  to: string | string[];

  /**
   * Carbon copy email address to send to
   */
  cc?: string | string[];

  /**
   * Blind carbon copy address to send to
   */
  bcc?: string | string[];

  /**
   * Override from email address ( check provider permissions )
   */
  from?: string;

  /**
   * Override replyTo to email address
   */
  replyTo?: string | string[];

  /**
   * Email subject
   */
  subject: string;

  /**
   * Html content
   */
  htmlContent: string;

  /**
   * Text content ( displays on summaries )
   */
  textContent: string;
}

export interface IEmailTemplatedData<T extends Record<string, any> = any> extends Partial<IEmailPartialData> {
  to: string | string[];

  /**
   * Build in template options
   */
  templateOptions?: {
    enabled: boolean;
  };

  /**
   * Email template name
   */
  template?: string;

  /**
   * Email template name
   */
  templateValues?: T;

  /**
   * Email subject
   */
  subject?: string;

  /**
   * Html content
   */
  htmlContent?: string;

  /**
   * Text content ( displays on summaries )
   */
  textContent?: string;
}

export interface IEmailData<T extends Record<string, any> = any> extends IEmailTemplatedData<T> {
  /**
   * From email address
   */
  from: string;
}

export interface IEmailAddressJson {
  name?: string;
  email: string;
}

export interface IEmailSendResponse<T = any> {
  messageId?: string;
  /**
   * Provider specific response
   */
  response: T;
}

import type { ClassConstructor } from 'class-transformer';

export const EMAIL_TEMPLATE_METADATA = 'EMAIL_TEMPLATE_METADATA';

export interface IEmailTemplate {
  /**
   * Template unique name
   */
  name: string;

  /**
   * Engine to use for rendering the template
   *  - `mjml` for MJML, simple {{ interpolation }} is supported
   *  - `html` for wrapping content into a simple html body, with {{ interpolation }}
   *  - none for only {{ interpolation }}
   */
  engine: 'mjml' | 'html' | string;

  /**
   * Template to interpolate with the data
   */
  html: string;

  /**
   * Text version of the template
   */
  text: string;

  /**
   * Subject to interpolate with the data
   */
  subject: string;
}

/**
 * Email template definition options
 */
export interface IEmailTemplateDecoratorOptions {
  /**
   * Default template
   */
  template: IEmailTemplate | string;

  /**
   * Validation class using class-validator
   */
  validate?: ClassConstructor<object>;
}
