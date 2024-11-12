import { type ModuleMetadata } from '@nestjs/common';

import { AuthnIdentityPersistor } from '../../authn-identity-persistor.abstract';
import { PrismaAuthnPersistor } from './prisma-authn.persistor';

/**
 * Store auth data using Prisma
 */
export const PrismaAuthnPersistorPlugin: ModuleMetadata = {
  providers: [{ provide: AuthnIdentityPersistor, useClass: PrismaAuthnPersistor }],
};
