import { createScaffolding } from '@povio/scaffold';
import { satisfies } from '@povio/scaffold/dist/plugins/semver';
import { z } from '@povio/scaffold/dist/plugins/zod';

const PrismaScaffoldOptions = z.object({
  mode: z.enum(['disabled', 'enabled', 'purged']).default('disabled'),
  autoMigrate: z.boolean().default(false),
});

export default createScaffolding({
  name: '~database/prisma',

  configSchema: PrismaScaffoldOptions,

  async init({ config, modules }, { addRequest, setStatus, addMessage }) {
    await addRequest({
      match: 'tsconfig:exclude',
      value: { path: 'src/database/prisma', excluded: config!.mode === 'disabled', context: '[all]' },
    });

    if (config!.mode === 'disabled') {
      setStatus('disabled');
      return;
    }

    const projectName = modules['project']?.config?.name ?? 'myapp';

    // todo purged mode

    // check dependencies
    for (const [mod, ver] of Object.entries({
      '~common/logger': '^1.0.0',
      '~common/validate': '^1.0.0',
      '~common/config': '^1.0.0',
    })) {
      if (!modules[mod] || !satisfies(modules[mod].version ?? '1.0.0', ver)) {
        addMessage('error', `Missing or incompatible module: ${mod}`);
        setStatus('errored');
        return;
      }
    }

    for (const value of [
      { pkg: '@prisma/internals@^5.21.1' },
      { pkg: '@prisma/client@^5.21.1' },
      { pkg: 'prisma@^5.21.1' },
    ]) {
      await addRequest({
        match: 'package.json:dependency',
        value,
      });
    }

    await addRequest({
      match: 'package.json:value',
      description: 'prisma schema location',
      value: {
        path: 'prisma',
        value: { schema: 'resources/prisma/schema.prisma' },
        state: 'equals',
      },
    });

    await addRequest({
      match: 'nest-module:activate',
      description: 'activate prisma module',
      value: {
        module: 'AppModule',
        fileImports: [['PrismaModule', '~database/prisma']],
        imports: ['PrismaModule'],
      },
    });

    await addRequest({
      match: 'scripts:set',
      description: 'inject bootstrap script',
      value: {
        module: 'bootstrap.d',
        state: 'created',
        name: '30_prisma.sh',
        // language=sh
        value: `#!/bin/bash

# generate prisma environment file
if [ -f dist/database/prisma/scripts/bootstrap.js ]; then
  yarn node dist/database/prisma/scripts/bootstrap.js
else
  yarn tsx src/database/prisma/scripts/bootstrap.ts
fi
`,
      },
    });

    await addRequest({
      match: 'scripts:set',
      description: 'inject prisma client generation script',
      value: {
        module: 'build.d',
        state: 'created',
        name: '30_prisma.sh',
        value:
          // language=sh
          `#!/bin/bash

# generate prisma client
yarn prisma generate --no-hints --allow-no-models

# rebuild prisma client
yarn rebuild @prisma/client 1>/dev/null
`,
      },
    });

    await addRequest({
      match: 'scripts:set',
      description: 'inject prisma docker installation script',
      value: {
        module: 'docker-install.d',
        state: 'created',
        name: '10_prisma.sh',
        value:
          // language=sh
          `#!/bin/bash

# Prisma requires libssl-dev to build and procps to have at least ps available in the container.
apt -y update
apt -y install openssl libssl-dev procps ca-certificates
apt-get autoclean
apt-get clean
rm -rf /var/lib/apt && rm -rf /var/cache/apt
`,
      },
    });

    await addRequest({
      match: 'dot-config:configure',
      description: 'inject basic prisma config into deployment configs',
      value: {
        stage: '[deployed]',
        state: 'created',
        value: {
          prisma: {
            url: '${env:DATABASE_URL}',
            log: ['info', 'warn', 'error'],
            autoMigrate: config!.autoMigrate,
          },
        },
      },
    });

    await addRequest({
      match: 'dot-config:configure',
      description: 'inject basic prisma config into local config',
      value: {
        stage: '[local]',
        state: 'created',
        value: {
          prisma: {
            log: ['query', 'info', 'warn', 'error'],
          },
        },
      },
    });

    await addRequest({
      match: 'dot-config:configure',
      description: 'inject basic prisma config into local config',
      value: {
        stage: 'local',
        state: 'equals',
        value: {
          'prisma.url': `postgresql://admin:admin@localhost:5432/${projectName}`,
        },
      },
    });

    await addRequest({
      match: 'dot-config:configure',
      description: 'inject basic prisma config into local config',
      value: {
        stage: 'test',
        state: 'equals',
        value: {
          'prisma.url': `postgresql://admin:admin@localhost:5432/${projectName}-test`,
          'prisma.autoConnect': false,
        },
      },
    });

    await addRequest({
      match: 'docker-compose:configure',
      description: 'inject basic postgres service into docker-compose',
      value: {
        state: 'created',
        value: {
          'services.postgres': {
            image: 'postgres:15.6-alpine',
            ports: ['5432:5432'],
            volumes: [`postgres-data:/var/lib/postgresql/data`],
            environment: {
              POSTGRES_USER: 'admin',
              POSTGRES_PASSWORD: 'admin',
            },
          },
          'volumes.postgres-data': {},
        },
      },
    });

    if (config!.autoMigrate) {
      await addRequest({
        match: 'scripts:set',
        description: 'inject prisma runtime migrate script',
        value: {
          module: 'docker-start.d',
          state: 'created',
          name: '30_prisma.sh',
          value:
            // language=sh
            `#!/bin/bash

. resources/prisma/.env

if [ "$DATABASE_AUTO_MIGRATE" = "true" ]; then
  # migrate prisma database
  yarn prisma migrate deploy
fi


`,
        },
      });
    }
  },
});
