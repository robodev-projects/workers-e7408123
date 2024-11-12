import { createScaffolding } from '@povio/scaffold';

export default createScaffolding({
  name: '~common/email/providers/aws-ses',

  async init({ modules }, { setStatus, addRequest }) {
    const emailConfig = modules['~common/email']?.config;
    const emailEnabled = emailConfig?.mode !== 'disabled';
    const enabled = emailConfig?.provider === 'aws-ses';

    await addRequest({
      match: 'tsconfig:exclude',
      value: { path: 'src/common/email/providers/aws-ses', excluded: emailEnabled && !enabled, context: '[all]' },
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
          ['EmailModule', '~common/email'],
          ['AwsSesEmailModule', '~common/email/providers/aws-ses'],
        ],
        // todo, deep injecting
        imports: [`EmailModule.forRoot([AwsSesEmailModule]),`],
      },
    });
    */

    // todo localstack docker

    await addRequest({
      match: 'dot-config:configure',
      value: {
        stage: '[local]',
        state: 'created',
        value: {
          'email.awsSes.apiEndpoint': 'http://localhost:4566',
          'email.awsSes.accessKeyId': 'random-key',
          'email.awsSes.secretAccessKey': 'random-secret',
          'email.awsSes.region': 'us-east-1',
        },
      },
    });

    await addRequest({
      match: 'package.json:dependency',
      value: { pkg: '@aws-sdk/client-ses' },
    });
  },
});
