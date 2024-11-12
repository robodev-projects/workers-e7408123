import type { ValueProvider } from '@nestjs/common/interfaces/modules/provider.interface';
import { mock } from 'node:test';

import { LocalAuthnPersistor } from '../local-authn-persistor.abstract';
import { ILocalAuthnIdentity, ILocalAuthnIdentityCreate, ILocalAuthnIdentityUpdate } from '../local-authn.types';

export const LocalAuthnPersistorMock: ValueProvider = {
  provide: LocalAuthnPersistor,
  useValue: {
    findLocalIdentity: mock.fn(async (where: { id: string }): Promise<ILocalAuthnIdentity | null> => {
      return {
        id: where.id,
        validated: false,
        disabled: false,
        email: '',
        magicLinkCode: undefined,
        magicLinkCodeExpiresAt: undefined,
        password: 'mock-password-hash',
        createdAt: new Date(),
      };
    }),

    createLocalIdentity: mock.fn(async (data: ILocalAuthnIdentityCreate): Promise<ILocalAuthnIdentity> => {
      return {
        id: 'mock-id',
        ...data,
        disabled: false,
        validated: true,
        createdAt: new Date(),
      };
    }),

    updateLocalIdentity: mock.fn(
      async (where: { id: string }, data: ILocalAuthnIdentityUpdate): Promise<ILocalAuthnIdentity> => {
        return {
          id: where.id,
          email: 'mock-email',
          ...data,
          disabled: false,
          validated: false,
          password: 'mock-password-hash',
          createdAt: new Date(),
        };
      },
    ),

    deleteLocalIdentity: mock.fn(async (): Promise<void> => {
      // This method doesn't return anything
    }),
  } satisfies LocalAuthnPersistor,
};
