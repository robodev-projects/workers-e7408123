import { createScaffolding } from '@povio/scaffold';

export default createScaffolding({
  name: '~common/media/providers/aws-s3',

  async init({ modules }, { setStatus, addRequest }) {
    const mediaConfig = modules['~common/media']?.config;
    const mediaEnabled = mediaConfig?.mode !== 'disabled';
    const enabled = mediaConfig?.providers?.includes('aws-s3');

    await addRequest({
      match: 'tsconfig:exclude',
      value: { path: 'src/common/media/providers/aws-s3', excluded: mediaEnabled && !enabled, context: '[all]' },
    });

    if (!enabled) {
      setStatus('disabled');
      return;
    }

    /*
    await addRequest({
      match: 'nest-module:activate',
      description: 'activate media module',
      value: {
        module: 'AppModule',
        fileImports: [
          ['EmailModule', '~common/media'],
          ['AwsSesEmailModule', '~common/media/providers/aws-ses'],
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
          'media.awsS3.bucket': 'media',
          'media.awsS3.apiEndpoint': 'http://localhost:4566',
          'media.awsS3.accessKeyId': 'random-key',
          'media.awsS3.secretAccessKey': 'random-secret',
          'media.awsS3.region': 'us-east-1',
        },
      },
    });

    await addRequest({
      match: 'dot-config:configure',
      value: {
        stage: '[deployed]',
        state: 'created',
        value: {
          'media.awsS3.bucket': '${env:MEDIA_BUCKET}',
          'media.awsS3.prefix': 'uploads/',
          'media.awsS3.publicUrl': '${env:MEDIA_PUBLIC_URL}',
        },
      },
    });

    for (const pkg of [
      '@aws-sdk/client-s3',
      '@aws-sdk/cloudfront-signer',
      '@aws-sdk/s3-presigned-post',
      '@aws-sdk/s3-request-presigner',
      'file-type@^19.6.0',
      '@tokenizer/s3@^0.4.1',
      'mime-types@^2.1.35',
    ]) {
      await addRequest({
        match: 'package.json:dependency',
        value: { pkg },
      });
    }

    await addRequest({
      match: 'package.json:dependency',
      value: { pkg: '@types/mime-types', dev: true },
    });
  },
});
