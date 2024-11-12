import { Injectable } from '@nestjs/common';

import type { IEmailTemplate, IEmailTemplatedData } from './email.types';

@Injectable()
export class EmailTemplateCompiler {
  private replaceTemplateValues(templateString: string, values: Record<string, any>): string {
    if (values && Object.keys(values).length > 0) {
      for (const [key, value] of Object.entries(values)) {
        templateString = templateString.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), `${value}`);
      }
    }
    return templateString;
  }

  public async compile(data: IEmailTemplatedData, template: IEmailTemplate): Promise<IEmailTemplatedData> {
    let html = this.replaceTemplateValues(template.html, data.templateValues);
    const subject = this.replaceTemplateValues(template.subject, data.templateValues);
    const text = this.replaceTemplateValues(template.text, data.templateValues);

    if (template.engine.startsWith('html')) {
      /**
       * Wrap in a simple, full HTML document
       *  - <style> does not work in most email clients
       */
      html = [
        `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>`,
        html,
        '</body></html>',
      ].join('');
    }

    data.htmlContent = html;
    data.subject = subject;
    data.textContent = text;

    delete data.template;
    delete data.templateValues;
    delete data.templateOptions;

    return data;
  }
}
