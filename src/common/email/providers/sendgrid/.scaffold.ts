import { createScaffolding } from '@povio/scaffold';

export default createScaffolding({
  name: '~common/email/providers/sendgrid',

  async init({ modules }, { setStatus, addRequest }) {
    const emailConfig = modules['~common/email']?.config;
    const emailEnabled = emailConfig?.mode !== 'disabled';
    const enabled = emailConfig?.provider === 'sendgrid';

    await addRequest({
      match: 'tsconfig:exclude',
      value: { path: 'src/common/email/providers/sendgrid', excluded: emailEnabled && !enabled, context: '[all]' },
    });

    if (!enabled || !emailEnabled) {
      setStatus('disabled');
      return;
    }

    /*
    await addRequest({
      match: 'nest-module:activate',
      description: 'activate email module',
      value: {
        module: 'AppModule',
        fileImports: [
          ['EmailModule', '~database/email'],
          ['SendgridEmailModule', '~common/email/providers/sendgrid'],
        ],
        imports: [`EmailModule.forRoot([SendgridEmailModule]),`],
      },
    });
     */

    await addRequest({
      match: 'dot-config:configure',
      value: {
        stage: '[all]',
        state: 'created',
        value: {
          'email.sendgrid.apiKey': 'dummy-key',
        },
      },
    });

    await addRequest({
      match: 'package.json:dependency',
      value: { pkg: '@sendgrid^8.1.3' },
    });
  },
});
