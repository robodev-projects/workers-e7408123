import type { ValueProvider } from '@nestjs/common/interfaces/modules/provider.interface';
import { mock } from 'node:test';

import { AuthnIdentityPersistor } from '../authn-identity-persistor.abstract';
import type { IAuthnIdentity, IAuthnIdentityCreate, IAuthnIdentityUpdate } from '../authn.types';

export const AuthnIdentityPersistorMock: ValueProvider = {
  provide: AuthnIdentityPersistor,
  useValue: {
    findIdentity: mock.fn((where: { id: string; provider: string; providerId: string }) => {
      return Promise.resolve({
        id: where.id,
        provider: where.provider,
        providerId: where.providerId,
        type: 'mock-type',
        userId: 'mock-id',
        disabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }),

    createIdentity: mock.fn(async (data: IAuthnIdentityCreate): Promise<IAuthnIdentity> => {
      return {
        id: 'mock-created-id',
        ...data,
        disabled: false,
        createdAt: new Date(),
      };
    }),

    updateIdentity: mock.fn(
      async (
        where: { id: string; provider: string; providerId: string },
        data: IAuthnIdentityUpdate,
      ): Promise<IAuthnIdentity> => {
        return {
          ...where,
          ...data,
          provider: where.provider || 'mock-provider',
          providerId: where.providerId || 'mock-provider-id',
          type: 'mock-type',
          userId: 'mock-user-id',
          disabled: false,
          createdAt: new Date(),
        };
      },
    ),

    deleteIdentity: mock.fn(async (): Promise<void> => {
      // This method doesn't return anything
    }),
  } satisfies AuthnIdentityPersistor,
};
