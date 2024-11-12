# Orion API

This API was generated by Robodev.

Follow the instructions below to get started.

## Local development

### Packages

```bash
# Use the version of Node.js specified in the .nvmrc file
nvm use

# Set up package manager
corepack enable
```

### Setup project
```bash
# Install project packages
yarn

# Prepare local config template
yarn bootstrap

# Startup containers with required services
docker compose up -d
```

### Setup database

> [Prisma Migration Overview](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/overview)

```bash
# Build just the Prisma client
yarn prisma:generate

# Run migrations and build the Prisma client locally
yarn prisma:migrate:dev
```

### Build and Start

```bash
yarn build

# Start the application in watch mode for development
yarn start:dev
```

## Testing

```bash
# Test driven development
yarn test:watch
yarn yarn vitest -w --coverage

# Run only unit tests
yarn test:unit

# Run only e2e tests
#  requires related external services to be running
yarn test:e2e
```

## Contributing

```bash
# Lint and fix the project files
yarn lint:fix

# Commit changes using semantic commit messages
git commit -m "feat: my new feature"
```

## Documentation

```bash
# Generate Project Documentation
yarn docs
```

## Usage

### Swagger

Swagger API documentation can be accessed at route [/docs](http://localhost:3000/docs)

## Additional module documentation

- [Architecture](./docs/codebase/02_Architecture.md)
- [Configuration](./docs/codebase/04_Config.md)
- [Vendors](./docs/codebase/03_Vendors.md)
- [Observability](./docs/codebase/05_Observability.md)
- [REST API](./docs/codebase/06_REST.md)
- [Authentication](./src/modules/authn/docs/README.md)
- [OpenTelemetry](./src/common/logging/otel/README.md)
- [Media Provider with S3](./src/common/media/README.md)
- [Push Notifications](./src/common/push-notifications/README.md) with [Firebase Cloud Messaging](./src/common/push-notifications/providers/fcm/README.md)
- [Sendgrid](src/common/email/providers/sendgrid/README.md)
