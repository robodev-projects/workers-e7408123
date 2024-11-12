import { createScaffolding } from '@povio/scaffold';
import { z } from '@povio/scaffold/dist/plugins/zod';

export default createScaffolding({
  name: '~common/queues',

  configSchema: z.object({
    mode: z.enum(['disabled', 'enabled']).default('disabled'),
    provider: z.string().default('hotwire'),
  }),

  async init({ config }, { setStatus, addRequest }) {
    const enabled = config!.mode !== 'disabled';

    await addRequest({
      match: 'tsconfig:exclude',
      value: { path: 'src/common/queues', excluded: !enabled, context: '[all]' },
    });

    if (!enabled) {
      setStatus('disabled');
      return;
    }
  },
});
