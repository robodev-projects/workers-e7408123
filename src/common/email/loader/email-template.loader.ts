import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ContextIdFactory, DiscoveryService, MetadataScanner, ModuleRef } from '@nestjs/core';
import { Injector } from '@nestjs/core/injector/injector';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';

import { LoggerService } from '~common/logger';

import { EmailPreprocessorError } from '../email.exceptions';
import type { IEmailTemplateDecoratorOptions, IEmailTemplatedData } from '../email.types';
import { EmailTemplateMetadataAccessor } from './email-template-metadata.accessor';

@Injectable()
export class EmailTemplateLoader implements OnApplicationBootstrap {
  public readonly templates: Record<
    string,
    {
      templateOptions: IEmailTemplateDecoratorOptions;
      templateFunction: (data: IEmailTemplatedData) => Promise<IEmailTemplatedData>;
    }
  > = {};

  private readonly injector = new Injector();

  constructor(
    private readonly logger: LoggerService,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataAccessor: EmailTemplateMetadataAccessor,
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
          this.prepareIfEmailTemplate(instance, methodKey, isRequestScoped, wrapper.host as Module),
        );
      });
  }

  private prepareIfEmailTemplate(
    instance: Record<string, any>,
    methodKey: string,
    isRequestScoped: boolean,
    moduleRef: Module,
  ) {
    const processorMetadata = this.metadataAccessor.getMetadata(instance[methodKey]);
    if (!processorMetadata) {
      return;
    }

    for (const options of processorMetadata) {
      const { template } = options;

      const name = typeof template === 'string' ? template : template.name;

      if (this.templates[name]) {
        throw new Error(`Duplicate email template '${name}' found`);
      }

      this.logger.log(`${instance.constructor.name}:${methodKey} {${name}}`);

      this.templates[name] = {
        templateOptions: options,
        templateFunction: async (data: IEmailTemplatedData) => {
          let contextInstance = instance;
          if (isRequestScoped) {
            const contextId = ContextIdFactory.create();
            this.moduleRef.registerRequestByContextId(data, contextId);
            contextInstance = await this.injector.loadPerContext(instance, moduleRef, moduleRef.providers, contextId);
          }
          try {
            return await (contextInstance[methodKey] as (data: IEmailTemplatedData) => Promise<any>).call(
              contextInstance,
              data,
            );
          } catch (error) {
            throw new EmailPreprocessorError('Email Preprocessor Error', {
              cause: error,
              details: { data, template: name },
            });
          }
        },
      };
    }
  }
}
