
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

function setupObservability(serviceName = 'document-analysis-service') {
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
  });

  // Configure OTel exporter (default to console for local dev)
  const traceExporter = process.env.OTEL_EXPORTER_OTLP_ENDPOINT 
    ? new OTLPTraceExporter({
        url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
      })
    : undefined; // Will default to ConsoleSpanExporter if undefined

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Enable HTTP instrumentation
        '@opentelemetry/instrumentation-http': {
          enabled: true,
        },
        // Enable Express instrumentation
        '@opentelemetry/instrumentation-express': {
          enabled: true,
        },
      }),
    ],
  });

  // Initialize the SDK and register with the OpenTelemetry API
  sdk.start();

  // Gracefully shut down the SDK on process exit
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });
  
  return sdk;
}

// Initialize the OpenTelemetry SDK
setupObservability();

module.exports = { setupObservability };
