import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ContextIdFactory, DiscoveryService, MetadataScanner, ModuleRef } from '@nestjs/core';
import { Injector } from '@nestjs/core/injector/injector';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';

import { LoggerService } from '~common/logger';

import { PushNotificationProvider } from '../push-notification-provider.abstract';
import { PushNotificationError } from '../push-notification.exceptions';
import {
  IPushNotificationMessage,
  IPushNotificationTemplateData,
  IPushNotificationTemplateDecoratorOptions,
} from '../push-notification.types';
import { PushNotificationTemplateMetadataAccessor } from './push-notification.metadata-accessor';

@Injectable()
export class PushNotificationLoader implements OnApplicationBootstrap {
  public readonly templates: Record<
    string,
    {
      templateOptions: IPushNotificationTemplateDecoratorOptions;
      templateFunction: (
        data: IPushNotificationMessage & IPushNotificationTemplateData,
      ) => Promise<IPushNotificationMessage & IPushNotificationTemplateData>;
    }
  > = {};

  public providers: Record<string, PushNotificationProvider> = {};

  private readonly injector = new Injector();

  constructor(
    private readonly logger: LoggerService,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataAccessor: PushNotificationTemplateMetadataAccessor,
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
          this.registerTemplate(instance, methodKey, isRequestScoped, wrapper.host as Module),
        );
      });
  }

  private registerTemplate(
    instance: Record<string, any>,
    methodKey: string,
    isRequestScoped: boolean,
    moduleRef: Module,
  ) {
    const templateMetadata = this.metadataAccessor.getMetadata(instance[methodKey]);

    if (!templateMetadata) {
      return;
    }

    for (const options of templateMetadata) {
      const { template } = options;

      const name = template.name;

      if (this.templates[name]) {
        throw new Error(`Duplicate email template '${name}' found`);
      }

      this.logger.debug(`${instance.constructor.name}:${methodKey} {${name}}`);

      this.templates[name] = {
        templateOptions: options,
        templateFunction: async (data: IPushNotificationMessage & IPushNotificationTemplateData) => {
          let contextInstance = instance;
          if (isRequestScoped) {
            const contextId = ContextIdFactory.create();
            this.moduleRef.registerRequestByContextId(data, contextId);
            contextInstance = await this.injector.loadPerContext(instance, moduleRef, moduleRef.providers, contextId);
          }
          try {
            return await (
              contextInstance[methodKey] as (
                data: IPushNotificationMessage & IPushNotificationTemplateData,
              ) => Promise<IPushNotificationMessage>
            ).call(contextInstance, data);
          } catch (error) {
            throw new PushNotificationError('Push Notification Template Error', {
              cause: error,
              details: { data, template: name },
            });
          }
        },
      };
    }
  }

  /**
   * Register an authn provider by name
   */
  public registerProvider(name: string, provider: PushNotificationProvider): void {
    if (name in this.providers) {
      throw new Error(`Provider ${name} already registered`);
    }
    this.logger.debug(`Registered provider {${name}}`);
    this.providers[name] = provider;
  }
}
