import { createScaffolding, TsMorphModule } from '@povio/scaffold';
import { SourceFile, SyntaxKind } from '@povio/scaffold/dist/plugins/ts-morph';
import { z } from '@povio/scaffold/dist/plugins/zod';
import { join } from 'node:path';

export default createScaffolding({
  name: '~common/logger/otel',
  async init({ modules }, { addRequest, addExecutor, setStatus }) {
    const config = modules['~common/logger']?.config;
    const enabled = ['highlight', 'grafana'].includes(config?.provider);
    await addRequest({
      match: 'tsconfig:exclude',
      value: { path: 'src/common/logger/otel', excluded: !enabled, context: '[all]' },
    });
    if (!enabled) {
      setStatus('disabled');
      return;
    }

    let configValues: any = {
      enabled: false,
      debug: false,
      hostMetrics: false,
      apiMetrics: false,
      spanProcessor: 'simple',
      logRecordProcessor: 'simple',
      contexts: {
        Bootstrap: 'none',
        HttpException: 'error',
        ExceptionHandler: 'debug',
        RoutesResolver: 'none',
        RouterExplorer: 'none',
        NestApplication: 'none',
      },
    };

    switch (config!.provider) {
      case 'highlight':
        configValues = {
          ...configValues,
          exporterEndpoint: 'https://otel.highlight.io:4318',
          exporterTracesEndpoint: 'https://otel.highlight.io:4318/v1/traces',
          exporterLogsEndpoint: 'https://otel.highlight.io:4318/v1/logs',
          highlight: {
            projectId: false,
          },
        };
        break;
      case 'grafana':
        // todo, add grafana config
        break;
    }

    await addRequest({
      match: 'dot-config:configure',
      description: 'inject otel configuration into local config',
      value: {
        stage: '[deployed]',
        state: 'created',
        value: {
          logger: {
            output: 'console',
            level: 'debug',
            contexts: {
              Bootstrap: 'log',
              HttpException: 'warn',
              ExceptionHandler: 'debug',
              RoutesResolver: 'log',
              RouterExplorer: 'log',
              NestApplication: 'log',
            },
            otel: { ...configValues },
          },
        },
      },
    });

    const dependencies = [
      { pkg: '@opentelemetry/api@^1.9.0' },
      { pkg: '@opentelemetry/context-async-hooks@^1.25.1' },
      { pkg: '@opentelemetry/core@^1.25.1' },
      { pkg: '@opentelemetry/exporter-logs-otlp-http@^0.52.1' },
      { pkg: '@opentelemetry/exporter-trace-otlp-http@^0.52.1' },
      { pkg: '@opentelemetry/instrumentation-http@^0.52.1' },
      { pkg: '@opentelemetry/resources@^1.25.1' },
      { pkg: '@opentelemetry/sdk-logs@^0.52.1' },
      { pkg: '@opentelemetry/sdk-node@^0.52.1' },
      { pkg: '@opentelemetry/sdk-trace-base@^1.25.1' },
      { pkg: '@opentelemetry/semantic-conventions@^1.25.1' },
      { pkg: '@opentelemetry/api-logs@^0.52.1' },
      { pkg: 'nestjs-otel@^6.1.1' },
      { pkg: 'tslib@^2.6.3' },
    ];

    for (const dependency of dependencies) {
      await addRequest({
        match: 'package.json:dependency',
        value: dependency,
      });
    }

    await addRequest({ match: '~common/logger/basic:activate' });

    await addRequest({
      match: `~common/logger:activate`,
      description: 'inject otel logging globally',
      value: {
        LoggerService: ['OtelLoggerService', './otel/otel-logger.service'],
      },
    });

    await addRequest({
      match: 'nest-module:activate',
      description: 'activate otel module',
      value: {
        module: 'AppModule',
        fileImports: [['OtelModule', '~common/logger/otel/otel.module']],
        imports: ['OtelModule'],
      },
    });

    // inject instrumentation
    await addRequest({
      match: '~main:activate',
      description: 'instrument otel',
      value: {
        position: 'instrumentation',
        statement: "import './common/logging/otel/otel.instrument';",
      },
    });

    // allow to inject other instrumentation

    await addExecutor({
      match: '~common/logger/otel.instrument',
      description: 'inject into otel instrumentation',
      init: async (task, { addMessage }) => {
        const { fileImports, position, statement } = ActivateParams.parse(task.request.value);

        let changes = false;

        await (modules['ts-morph'] as TsMorphModule).withTsMorph(async ({ project }) => {
          const sourceFile = project.getSourceFile(join(__dirname, 'otel.instrument.ts'));
          if (!sourceFile) {
            addMessage('error', `otel.instrument.ts does not exist`);
            task.status = 'errored';
            return;
          }
          changes = handleImports(fileImports, sourceFile, addMessage) || changes;
          for (const block of [sourceFile, ...sourceFile.getDescendantsOfKind(SyntaxKind.Block)]) {
            if (block.getStatements().some((s) => s.getText() === statement)) {
              break;
            }
            const positionLine = block.getStatementsWithComments().find((s) => {
              return s.getText().match(new RegExp(`// hook: ${position}$`));
            });
            if (positionLine) {
              positionLine.replaceWithText(`${positionLine.getText()}\n\n${statement}`);
              changes = true;
              break;
            }
          }
        });

        task.status = changes ? 'queued' : 'conforming';
      },
      exec: async () => {},
    });

    // prisma instrumentation
    const prismaEnabled = modules['~database/prisma']?.config?.mode === 'enabled';
    if (prismaEnabled) {
      dependencies.push({ pkg: '@prisma/instrumentation@^5.16.2' });

      await addRequest({
        match: '~common/logger/otel.instrument',
        description: 'instrument otel with prisma',
        value: {
          position: 'instrumentations',
          statement: 'instrumentations.push(new PrismaInstrumentation());',
          fileImports: [['PrismaInstrumentation', '@prisma/instrumentation']],
        },
      });
    }
  },
});

const ActivateParams = z.object({
  fileImports: z.array(z.tuple([z.string(), z.string()])).optional(),
  position: z.string(),
  statement: z.string(),
});

function handleImports(
  fileImports: [string, string][] | undefined,
  appPipes: SourceFile,
  addMessage: (level: 'info' | 'error' | 'warning', a: string) => void,
) {
  let changes = false;
  for (const [importName, importPath] of fileImports || []) {
    const existingImport = appPipes.getImportDeclaration(importPath);

    if (existingImport) {
      if (!existingImport.getNamedImports().some((x) => x.getName() == importName)) {
        addMessage('info', `adding ${importName} from ${importPath}`);
        existingImport.addNamedImport(importName);
        changes = true;
      }
    } else {
      addMessage('info', `adding ${importName} from ${importPath}`);
      appPipes.addImportDeclaration({
        namedImports: [importName],
        moduleSpecifier: importPath,
      });
      changes = true;
    }
  }
  return changes;
}
