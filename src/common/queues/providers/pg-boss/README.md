# PG-BOSS Queue Provider

## Install

```bash
yarn add pg-boss
```

```typescript
import { Module } from '@nestjs/common';
import { PgBossQueueModule } from '~common/queues/providers/pg-boss';

@Module({
  imports: [
    QueueModule.forRoot([PgBossQueueModule]),
  ],
})
export class AppModule {}

```

## Configuration

```yaml
queues:
  pg-boss:
    url: postgresql://admin:admin@localhost:5432/database-name
    schema: pgboss
    maxConnections: 10
    # deleteAfterSeconds: 60
    # stopTimeout: 30000
    migrate: true
    schedule: true
    setupQueues: true
    runWorkers: true

    queues:
      - name: default
        policy: standard

    workers:
      - queue: default
        priority: true
        # pollingIntervalSeconds: 2
        # batchSize: 2
```


See database specific installation instructions in the [pg-boss documentation](https://timgit.github.io/pg-boss/#/install).
