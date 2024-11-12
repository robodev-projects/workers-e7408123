import { createScaffolding } from '@povio/scaffold';
import { z } from '@povio/scaffold/dist/plugins/zod';

const PinoLoggerScaffoldOptions = z.object({
  mode: z.enum(['disabled', 'enabled']).default('disabled'),
  plugins: z.array(z.enum(['pino-pretty'])).optional(),
});

export type IPinoLoggerScaffoldOptions = z.infer<typeof PinoLoggerScaffoldOptions>;

export default createScaffolding({
  name: '~common/logger/pino',

  configSchema: PinoLoggerScaffoldOptions,

  async init({ config }, { setStatus, addRequest }) {
    await addRequest({
      match: 'tsconfig:exclude',
      value: { path: 'src/common/logger/pino', excluded: config!.mode === 'disabled', context: '[all]' },
    });

    if (config!.mode === 'disabled') {
      setStatus('disabled');
      return;
    }

    await addRequest({ match: '~common/logger/basic:activate' });

    await addRequest({
      match: `~common/logger:activate`,
      description: 'inject pino logging globally',
      value: {
        LoggerService: ['PinoLoggerService', './pino/pino-logger.service'],
      },
    });

    const packages = [
      { pkg: 'pino@^9.0.0', dev: true },
      { pkg: 'pino-abstract-transport@^1.2.0', dev: true },
    ];

    if (config!.plugins?.includes('pino-pretty')) {
      packages.push({ pkg: 'pino-pretty@^11.0.0', dev: true });
    }

    for (const value of packages) {
      await addRequest({
        match: 'package.json:dependency',
        value,
      });
    }
  },
});
