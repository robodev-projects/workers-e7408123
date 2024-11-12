import { createScaffolding } from '@povio/scaffold';
import { z } from '@povio/scaffold/dist/plugins/zod';

export default createScaffolding({
  name: '~common/email',

  configSchema: z.object({
    mode: z.enum(['disabled', 'enabled']).default('disabled'),
    provider: z.string().default('aws-ses'),
  }),

  async init({ config }, { setStatus, addRequest }) {
    const enabled = config!.mode !== 'disabled';

    await addRequest({
      match: 'tsconfig:exclude',
      value: { path: 'src/common/email', excluded: !enabled, context: '[all]' },
    });

    if (!enabled) {
      setStatus('disabled');
      return;
    }

    await addRequest({
      match: 'dot-config:configure',
      value: {
        stage: '[all]',
        state: 'created',
        value: {
          'email.mode': 'enabled',
          'email.defaultFrom': 'info@example.com',
        },
      },
    });
  },
});
