import { Attributes, Span, diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { CompositePropagator, W3CBaggagePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { Resource } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { NodeSDK, NodeSDKConfiguration } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ClientRequest, IncomingMessage } from 'node:http';

import { getConfig } from '~common/config';
import { CoreConfig } from '~common/core';

import { HighLightConfig, LogRecordProcessorType, OtelConfig, SpanProcessorType } from './otel.config';

const otelConfig = getConfig(OtelConfig);

let otlSdk: NodeSDK;

if (otelConfig.enabled) {
  process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT = otelConfig.exporterLogsEndpoint;
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT = otelConfig.exporterEndpoint;

  if (otelConfig.debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);
  }

  const traceExporter = new OTLPTraceExporter({
    url: otelConfig.exporterTracesEndpoint,
  });

  const spanProcessor =
    otelConfig.spanProcessor == SpanProcessorType.SIMPLE
      ? new SimpleSpanProcessor(traceExporter)
      : new BatchSpanProcessor(traceExporter);

  const logExporter = new OTLPLogExporter();

  const logRecordProcessor =
    otelConfig.logRecordProcessor == LogRecordProcessorType.SIMPLE
      ? new SimpleLogRecordProcessor(logExporter)
      : new BatchLogRecordProcessor(logExporter);

  const coreConfig = getConfig(CoreConfig);

  const attributes: Attributes = {
    [SEMRESATTRS_SERVICE_NAME]: coreConfig.service,
    [SEMRESATTRS_SERVICE_VERSION]: coreConfig.version,
  };

  const highLightConfig = getConfig(HighLightConfig);
  if (highLightConfig.projectId) {
    attributes['highlight.project_id'] = highLightConfig.projectId;
  }

  const nodeSDKConfig: Partial<NodeSDKConfiguration> = {
    serviceName: coreConfig.service,
    resource: new Resource(attributes),
    spanProcessors: [spanProcessor],
    logRecordProcessor,
    contextManager: new AsyncLocalStorageContextManager(),
    textMapPropagator: new CompositePropagator({
      propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
    }),
  };

  const instrumentations = [
    new HttpInstrumentation({
      requireParentforOutgoingSpans: true,
      requestHook: (span: Span, request: IncomingMessage | ClientRequest) => {
        span.updateName(`${request.method} ${request instanceof IncomingMessage ? request.url : ''}`);
      },
      enabled: true,
    }),
  ];

  // hook: instrumentations

  otlSdk = new NodeSDK({
    ...nodeSDKConfig,
    instrumentations,
  });

  otlSdk.start();
}

export async function shutdown() {
  if (otlSdk) {
    await otlSdk.shutdown();
  }
}
