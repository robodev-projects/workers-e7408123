import { Module } from '@nestjs/common';

import { applyModulePlugins, deferComposableModule } from '~common/utils/nestjs';

import { KVStoreProvider } from './kvstore.provider.abstract';

@Module({})
export class KVStoreModule {
  /**
   * Configure KVStoreModule
   */
  static forRoot = deferComposableModule({
    module: KVStoreModule,
    providers: [{ provide: 'KVStoreNamespace', useValue: 'default' }],
    exports: [KVStoreProvider],
  });

  /**
   * Get custom KVStoreProvider namespace
   */
  static async forFeature(namespace: string) {
    return applyModulePlugins(await KVStoreModule.forRoot(), [
      {
        imports: [],
        providers: [{ provide: 'KVStoreNamespace', useValue: namespace }],
        exports: [KVStoreProvider],
        controllers: [],
      },
    ]);
  }
}
