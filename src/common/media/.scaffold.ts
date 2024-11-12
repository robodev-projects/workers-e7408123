import { createScaffolding } from '@povio/scaffold';
import { z } from '@povio/scaffold/dist/plugins/zod';

export default createScaffolding({
  name: '~common/media',

  configSchema: z.object({
    mode: z.enum(['disabled', 'enabled']).default('disabled'),
    providers: z.array(z.string()),
  }),

  async init({ config }, { setStatus, addRequest }) {
    const enabled = config!.mode !== 'disabled';

    await addRequest({
      match: 'tsconfig:exclude',
      value: { path: 'src/common/media', excluded: !enabled, context: '[all]' },
    });

    if (!enabled) {
      setStatus('disabled');
      return;
    }
  },
});
