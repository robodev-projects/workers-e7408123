# Prisma ORM example

This example brings a basic implementation of [Prisma ORM](https://www.prisma.io/) to a NestJS project. Prisma is a new
kind of ORM which
greatly reduces the development time and improve DX when dealing with the data persistence layer.

Here is a good [learning resource](https://www.prisma.io/docs/concepts/overview/prisma-in-your-stack/is-prisma-an-orm)to
get familiar with the basic concepts and to find out what are the key
distinctions with other ORMs (i.e. TypeORM).

## Getting started

#### Install dependencies

```bash
yarn add prisma @prisma/internals @prisma/client
```

Configure schema path in `package.json`:

```json
{
  "prisma": {
    "schema": "resources/prisma/schema.prisma"
  }
}
```

Add database credentials to environment (see below for local database setup):

```yarn
prisma:
  url: 'postgresql://admin:admin@localhost:5432/myapp'
  log: ['query', 'info', 'warn', 'error']
```

> Prisma can use an .env file next to the schema location

And inject into the project:

```typescript
import { Global, Module } from '@nestjs/common';

import { getConfigFactory } from '~common/config';
import { LoggerModule } from '~common/logger';

import { PrismaService, PrismaConfig } from '~database/prisma';

@Global()
@Module({
  imports: [LoggerModule],
  providers: [PrismaService, getConfigFactory(PrismaConfig)],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

#### Setup

```bash
# Generate .env file next to Prisma schema
# yarn tsx src/database/prisma/scripts/bootstrap.ts
yarn bootstrap
```

```bash
# Generate Prisma client (always run after .schema changes)
yarn prisma generate && yarn rebuild @prisma/client
```

### Production

See https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production

And https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate

```bash
# Run migration in production
#  !! do not run this command locally/remotely
yarn prisma migrate deploy
```

todo: add warning for long-running migration


## Development

### Local database

Use the following docker-compose configuration to start a local PostgreSQL database:

```yml
services:
  postgres:
    image: postgres:15.6-alpine
    ports:
      - '5432:5432'
    volumes:
      - local-myapp-dbdata:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin
      POSTGRES_DATABASE: myapp
```

### Per module schema

Prisma does not yet support per module schemas natively, you can use the `mergePrismaSchema` utility to combine all the
schemas into a single file.

The base schema should contain the `datasource` block and other project wide entities. Modules can then contain their
own module specific entities and copies of the dependant modules. Running the script will merge all the schemas into
a single file.

```bash
# Install module schema support dependencies
yarn add -D fast-glob @mrleebo/prisma-ast
```

#### Usage

```bash
# Combine per-module schema
# yarn tsx src/database/prisma/scripts/merge.ts
yarn prisma:merge

# Re-generate Prisma client
yarn prisma generate && yarn rebuild @prisma/client
```

### Create Repository

enhancement: add repository example

### Apply schema to database

```bash
# Migrate the local database
#  and create a new migration if drift is detected
#  this is a destructive operation
yarn prisma migrate dev
```

```bash
# Reset the local database
#  this will remove all data
yarn prisma migrate reset
```

```bash
# Pull database changes into schema.prisma
#  this will overwrite the schema.prisma file with the current database schema
#  if using per-module schema you will need to manually apply the changes to the module schemas
yarn prisma db pull
```

### Add a seed to speed up developer onboarding

enhancement: add seed example

### End-to-end testing

enhancement: add e2e testing example

### Fixtures

enhancement: add fixture example

### Debugging

#### Debug prisma client itself

Prisma logs only Query related logs by default. To see more logs, you can set the `DEBUG` environment variable.

See https://www.prisma.io/docs/orm/prisma-client/debugging-and-troubleshooting/debugging

```bash
DEBUG="prisma:*" yarn start
```


## Metrics

See https://www.prisma.io/docs/orm/prisma-client/observability-and-logging/metrics

## OpenTelemetry

See https://www.prisma.io/docs/orm/prisma-client/observability-and-logging/opentelemetry-tracing
