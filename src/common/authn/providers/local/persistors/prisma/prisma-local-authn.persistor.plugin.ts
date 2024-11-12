import { type ModuleMetadata } from '@nestjs/common';

import { LocalAuthnPersistor } from '../../local-authn-persistor.abstract';
import { PrismaLocalAuthnPersistor } from './prisma-local-authn.persistor';

export const PrismaLocalAuthnPersistorPlugin: ModuleMetadata = {
  providers: [{ provide: LocalAuthnPersistor, useClass: PrismaLocalAuthnPersistor }],
};
