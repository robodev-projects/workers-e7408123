import type { ClassConstructor } from 'class-transformer';

export const QUEUE_PROCESSOR_METADATA = 'QUEUE_PROCESSOR_METADATA';

/**
 * Job options
 *  - stored by the queue provider
 */
export interface JobOptions {
  /**
   * Job timeout in milliseconds
   */
  timeout?: number;

  /**
   * Override jobId
   *  - adding the same job twice will result in subsequent jobs being ignored
   *     until the job is removed
   *  - see provider for specifics
   */
  id?: string | number;
}

/**
 * Job payload
 *  - stored in the queue
 */
export interface JobPayload<T> {
  /**
   * Processor name
   */
  name: string;
  /**
   * Parameters to be passed to the processor
   */
  data?: T;
}

/**
 * Job instance
 */
export interface Job<D = any> extends JobPayload<D> {
  /**
   * Generic caller options implemented by all providers
   */
  options?: JobOptions;

  /**
   * Job ID generated by provider
   */
  id?: string | number;

  /**
   * Provider caller options, specific to the provider
   *  - passed to the provider at job creation
   */
  providerOptions?: Record<string, any>;

  /**
   * Provider config, specific to the provider
   *  - pulled from getConfig
   */
  providerConfig?: Record<string, any>;

  /**
   * Provider context data
   *  - generated by the provider
   */
  providerContext?: Record<string, any>;

  context?: {
    /**
     * How much time do we have to finish the job before it's considered failed
     */
    timeout?: number;
  };

  /**
   * Processor context
   */
  processorSettings?: ProcessorSettings;

  /**
   * Job status
   */
  status?: 'draft' | 'queued' | 'started' | 'completed' | 'failed';

  result?: any;
}

/**
 * Processor settings
 */
export interface ProcessorSettings {
  /**
   * Processor Name
   */
  name: string;

  /**
   * Processors in the same queue will:
   *  - default to settings of the queue
   *  - be processed in sequence if the queue is FIFO
   *  - share the same concurrency per executor
   */
  queue: string;

  // type of class-validator object to validate input
  validate?: ClassConstructor<object>;

  timeout?: number;
}
