import { Injectable } from '@nestjs/common';

import { LoggerService } from '~common/logger';
import { plainToValidatedInstance } from '~common/validate';

import { EmailProvider } from './email-provider.abstract';
import { EmailTemplatePersistor } from './email-template-persistor.abstract';
import { EmailTemplateCompiler } from './email-template.compiler';
import { EmailConfig } from './email.config';
import { EmailSendError } from './email.exceptions';
import type { IEmailData, IEmailPartialData, IEmailSendResponse, IEmailTemplatedData } from './email.types';
import { EmailTemplateLoader } from './loader/email-template.loader';

@Injectable()
export class EmailService {
  constructor(
    private readonly logger: LoggerService,
    private readonly emailConfig: EmailConfig,
    private readonly templateLoader: EmailTemplateLoader,
    private readonly emailProvider: EmailProvider,
    private readonly templateCompiler: EmailTemplateCompiler,
    private readonly templatePersistor: EmailTemplatePersistor,
  ) {}

  private _canSend(data: Partial<IEmailData>) {
    if (this.emailConfig.mode === 'disabled') {
      throw new EmailSendError('Email is disabled');
    } else if (this.emailConfig.mode === 'no-op') {
      if (this.logger.isLevelEnabled('verbose')) {
        this.logger.verbose('suppressed', { data: { to: data.to } });
      } else {
        this.logger.log('suppressed', { data });
      }
      return;
    }
  }

  async send(data: IEmailPartialData): Promise<IEmailSendResponse> {
    this._canSend(data);

    if ('template' in (data as any)) {
      throw new EmailSendError('Template not supported in this context');
    }

    const from = data.from ?? this.emailConfig.defaultFrom;
    if (!from) {
      throw new EmailSendError('No from address provided');
    }

    try {
      const response = await this.emailProvider.send({ ...data, from });
      if (this.logger.isLevelEnabled('verbose')) {
        this.logger.verbose('sent', { data: { to: data.to } });
      } else {
        this.logger.debug('sent', { data });
      }
      return response;
    } catch (error) {
      const e =
        error instanceof EmailSendError
          ? error
          : new EmailSendError('Error sending email', { details: { data }, cause: error });
      this.logger.error('send', { data, error: e });
      throw e;
    }
  }

  async sendTemplate<T extends Record<string, any>>(
    data: Omit<IEmailTemplatedData, 'template' | 'templateValues'>,
    name: string,
    values?: T,
  ): Promise<IEmailSendResponse> {
    this._canSend(data);

    const { enableLocalTemplates: localTemplate, defaultFrom } = this.emailConfig;

    let computed: IEmailTemplatedData = {
      ...data,
      from: data.from ?? defaultFrom,
      template: name,
      templateValues: values,
      templateOptions: { enabled: localTemplate },
    };

    const preprocessor = this.templateLoader.templates[name];
    if (preprocessor) {
      let templateValues = computed.templateValues;
      if (preprocessor.templateOptions?.validate) {
        templateValues = plainToValidatedInstance(preprocessor.templateOptions?.validate, templateValues);
      }

      /**
       * Preprocess the email using the EmailTemplateDecorator
       *  the decorator can modify the data or template name, inject data, etc
       */
      computed = await preprocessor.templateFunction({ ...computed, templateValues });
    }

    /**
     * Preprocess the email data using the provider service
     *  the provider can decide to modify the data, use an internal template, etc
     */
    computed = await this.emailProvider.preprocess(computed);

    /**
     * If the templates are enabled and were not disabled by the preprocessors
     */
    if (computed.templateOptions?.enabled) {
      // find in persistent provider
      let template = await this.templatePersistor.findByName(name);

      // if it does not exist, use the preprocessor template
      if (
        !template &&
        preprocessor?.templateOptions?.template &&
        typeof preprocessor.templateOptions.template !== 'string'
      ) {
        template = preprocessor.templateOptions.template;
      }

      if (!template) {
        throw new EmailSendError(`Template '${name}' not found`);
      }

      // render the template using the selected engine
      computed = await this.templateCompiler.compile(computed, template);
    }

    if (computed.templateOptions?.enabled || !computed.template) {
      for (const key of ['from', 'subject', 'textContent', 'htmlContent'] as Array<keyof IEmailData>) {
        if (!(key in computed) || !computed[key]) {
          throw new EmailSendError(`No ${key} provided`);
        }
      }
    } // else the template was disabled by the preprocessors but a template was provided

    try {
      const response = await this.emailProvider.send(computed as IEmailData);
      if (this.logger.isLevelEnabled('verbose')) {
        this.logger.verbose('sent', { data, computed });
      } else {
        this.logger.debug('sent', { data, template: computed.template });
      }
      return response;
    } catch (error) {
      const e =
        error instanceof EmailSendError
          ? error
          : new EmailSendError('Error sending email template', { details: { data }, cause: error });
      this.logger.error('send', { data, error: e });
      throw e;
    }
  }
}
