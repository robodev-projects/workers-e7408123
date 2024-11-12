# OpenTelemetry

> See [Observability](../../../../docs/codebase/04_Observability.md)
>
> More info: [What is OpenTelemetry? A Straightforward Guide](https://www.aspecto.io/blog/what-is-opentelemetry-the-infinitive-guide/)


## Local Installation

1. Install packages

```bash
yarn add @opentelemetry/api @opentelemetry/context-async-hooks @opentelemetry/core \
  @opentelemetry/exporter-logs-otlp-http @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/instrumentation-http @opentelemetry/resources @opentelemetry/sdk-logs \
  @opentelemetry/sdk-node @opentelemetry/sdk-trace-base @opentelemetry/semantic-conventions\
  @opentelemetry/api-logs nestjs-otel tslib
```

2. Inject the instrumentation in the main file at the top

```typescript
import 'reflect-metadata';
import './common/logging/otel/otel.instrument';
```

3. Inject the `OtelModule` in the `app.module.ts`

4. Use `OtelLoggerService` as the main LoggerService in the app - see [LoggerService](docs/template/05_Observability.md)

## Providers

### Highlight.io

1. [Sign up](https://www.highlight.io/) at highlight.io
2. Configure the highlight.io exporter in `local.api.template.yml`

```yaml
logging:
  otel:
    enable: true
    exporterEndpoint: 'https://otel.highlight.io:4318',
    exporterTracesEndpoint: 'https://otel.highlight.io:4318/v1/traces',
    exporterLogsEndpoint: 'https://otel.highlight.io:4318/v1/logs',
    highlight:
      # required to enable highlight.io
      projectId: ''
```

# Usage

Traces and logs for the following are created automatically:

- http requests
- prisma (includes db query)

If you need to add custom traces you can use [Span Decorator](#span-decorator) and [Tracing Service](#tracing-service)

### Span Decorator

If you need, you can define a custom Tracing Span for a method. It works async or sync. Span takes its name from the
parameter; but by default, it is the same as the method's name

```typescript
import { Span } from 'nestjs-otel';

class BookService {
  @Span('CRITICAL_SECTION')
  async getBooks() {
    return [`Harry Potter and the Philosopher's Stone`];
  }
}
```

### Tracing Service

In case you need to access native span methods for special logics in the method block:

```typescript
import { TraceService } from 'nestjs-otel';

@Injectable()
export class BookService {
  constructor(private readonly traceService: TraceService) {
  }

  @Span()
  async getBooks() {
    const currentSpan = this.traceService.getSpan(); // --> retrives current span, comes from http or @Span
    await this.doSomething();
    currentSpan.addEvent('event 1');
    currentSpan.end(); // current span end

    const span = this.traceService.startSpan('sub_span'); // start new span
    span.setAttributes({ userId: 1 });
    await this.doSomethingElse();
    span.end(); // new span ends
    return [`Harry Potter and the Philosopher's Stone`];
  }
}
```

> More info [(Source) NestJS OpenTelemetry (OTEL)](https://github.com/pragmaticivan/nestjs-otel)
>
> Troubleshooting [Checklist for Troubleshooting OpenTelemetry NodeJS Tracing Issues](https://www.aspecto.io/blog/checklist-for-troubleshooting-opentelemetry-nodejs-tracing-issues/)

## Local Telemetry Exporter

See https://github.com/poviolabs/nestjs-template/tree/v4/otel-grafana-local
