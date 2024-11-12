import { INestApplication, type ModuleMetadata } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';

import { applyModulePlugins } from '~common/utils/nestjs';

/**
 * Prepare a testing application for e2e tests
 */
export async function createBaseTestingModule(
  /**
   * Extra modules to inject into the testing app
   */
  plugins?: ModuleMetadata[] | ModuleMetadata,
  options?: {
    beforeCompile?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
    beforeInit?: (app: INestApplication<any>) => INestApplication<any>;
  },
): Promise<INestApplication> {
  let builder = Test.createTestingModule(
    applyModulePlugins({}, plugins ? (Array.isArray(plugins) ? plugins : [plugins]) : []),
  );

  /**
   * Custom overrides
   */
  if (options?.beforeCompile) {
    builder = options.beforeCompile(builder);
  }

  let app = (await builder.compile()).createNestApplication();

  app.enableShutdownHooks();

  if (options?.beforeInit) {
    app = options.beforeInit(app);
  }

  return await app.init();
}
