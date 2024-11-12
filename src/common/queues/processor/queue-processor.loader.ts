import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ContextIdFactory, DiscoveryService, MetadataScanner, ModuleRef } from '@nestjs/core';
import { Injector } from '@nestjs/core/injector/injector';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';

import { LoggerService } from '~common/logger';

import { QueueConfig } from '../queue.config';
import { Job, ProcessorSettings } from '../queue.types';
import { QueueProcessorMetadataAccessor } from './queue-processor-metadata.accessor';

interface IQueueProcessorFunction {
  processorSettings: ProcessorSettings;
  processorFunction: (job: Job<any>) => any;
}

@Injectable()
export class QueueProcessorLoader implements OnApplicationBootstrap {
  public readonly processors: Record<string, IQueueProcessorFunction> = {};

  private readonly injector = new Injector();

  constructor(
    private readonly queueConfig: QueueConfig,
    private readonly logger: LoggerService,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataAccessor: QueueProcessorMetadataAccessor,
    private readonly metadataScanner: MetadataScanner,
    private readonly moduleRef: ModuleRef,
  ) {}

  onApplicationBootstrap() {
    this.discoveryService
      .getProviders()
      .filter((wrapper) => wrapper.instance && !wrapper.isAlias)
      .forEach((wrapper: InstanceWrapper) => {
        const { instance } = wrapper;
        const prototype = Object.getPrototypeOf(instance) || {};
        const isRequestScoped = !wrapper.isDependencyTreeStatic();
        this.metadataScanner.scanFromPrototype(instance, prototype, (methodKey: string) =>
          this.prepareIfProcessor(instance, methodKey, isRequestScoped, wrapper.host as Module),
        );
      });
  }

  private prepareIfProcessor(
    instance: Record<string, any>,
    methodKey: string,
    isRequestScoped: boolean,
    moduleRef: Module,
  ) {
    const processorMetadata = this.metadataAccessor.getMetadata(instance[methodKey]);
    if (!processorMetadata) {
      return;
    }

    for (const settings of processorMetadata) {
      if (this.processors[settings.name]) {
        throw new Error(`Duplicate processor '${settings.name}' found`);
      }

      this.logger.log(`${instance.constructor.name}:${methodKey} {${settings.queue}:${settings.name}}`);

      this.processors[settings.name] = {
        processorSettings: settings,
        processorFunction: async (job: Job<any>) => {
          let contextInstance = instance;
          if (isRequestScoped) {
            const contextId = ContextIdFactory.create();
            this.moduleRef.registerRequestByContextId(job, contextId);
            contextInstance = await this.injector.loadPerContext(instance, moduleRef, moduleRef.providers, contextId);
          }
          return await (contextInstance[methodKey] as (data: any) => Promise<any>).call(contextInstance, job);
        },
      };
    }
  }
}
