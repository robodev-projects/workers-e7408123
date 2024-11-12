import { createScaffolding } from '@povio/scaffold';

export default createScaffolding({
  name: '~common/queues/providers/pg-boss',

  async init({ modules }, { setStatus, addRequest }) {
    const queuesConfig = modules['~common/queues']?.config;
    const queuesEnabled = queuesConfig?.mode !== 'disabled';
    const enabled = queuesConfig?.provider === 'pg-boss';

    const projectName = modules['project']?.config?.name ?? 'myapp';

    await addRequest({
      match: 'tsconfig:exclude',
      value: { path: 'src/common/queues/providers/pg-boss', excluded: queuesEnabled && !enabled, context: '[all]' },
    });

    if (!enabled) {
      setStatus('disabled');
      return;
    }

    const config = {
      'queues.pg-boss.schema': 'pgboss',
      'queues.pg-boss.schedule': true,
      'queues.pg-boss.maxConnections': 10,
      'queues.pg-boss.migrate': true,
      'queues.pg-boss.setupQueues': true,
      'queues.pg-boss.runWorkers': true,
      'queues.pg-boss.queues': [
        {
          name: 'default',
          policy: 'standard',
        },
      ],
      'queues.pg-boss.workers': [
        {
          queue: 'default',
          priority: true,
          pollingIntervalSeconds: 2,
          batchSize: 2,
        },
      ],
    };

    await addRequest({
      match: 'dot-config:configure',
      value: {
        stage: '[local]',
        state: 'created',
        value: {
          'queues.pg-boss.url': `postgresql://admin:admin@localhost:5432/${projectName}`,
          ...config,
        },
      },
    });

    await addRequest({
      match: 'dot-config:configure',
      value: {
        stage: '[deployed]',
        state: 'created',
        value: {
          'queues.pg-boss.url': '${env:DATABASE_URL}',
          ...config,
        },
      },
    });

    await addRequest({
      match: 'package.json:dependency',
      value: { pkg: 'pg-boss@^10.1.5' },
    });
  },
});
