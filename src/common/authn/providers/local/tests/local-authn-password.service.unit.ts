import { type INestApplication } from '@nestjs/common';
import { Mock } from 'node:test';
import { beforeAll, describe, it } from 'vitest';

import { AuthnModule } from '~common/authn';
import { HotwireAuthnPlugin } from '~common/authn/providers/hotwire';
import { LocalAuthnPlugin } from '~common/authn/providers/local';
import { LocalAuthnPersistor } from '~common/authn/providers/local/local-authn-persistor.abstract';
import { LocalAuthnPasswordPlugin } from '~common/authn/providers/local/passwords';
import { LocalAuthnPersistorMock } from '~common/authn/providers/local/tests/authn-local.mock';
import { EmailModule } from '~common/email';
import { NoOpEmailTemplatePersistor } from '~common/email/persistors/no-op';
import { NoOpEmailProviderPlugin } from '~common/email/providers/no-op';
import { LoggerModule } from '~common/logger';
import { makeUUID } from '~common/utils/short-uuid';

import { createBaseTestingModule } from '~test/utils';

import { NotImplementedAuthnPersistorPlugin } from '../../../persistors/not-implemented';
import { LocalAuthnPasswordService } from '../passwords/local-authn-password.service';
import { NotImplementedLocalAuthnPersistorPlugin } from '../persistors/not-implemented';

describe('LocalAuthnPassword', () => {
  let app: INestApplication;
  let localAuthnPasswordService: LocalAuthnPasswordService;
  let findLocalIdentityMock: Mock<LocalAuthnPersistor['findLocalIdentity']>;

  beforeAll(async () => {
    app = await createBaseTestingModule(
      {
        imports: [
          //
          LoggerModule,
          EmailModule.forRoot([NoOpEmailProviderPlugin, NoOpEmailTemplatePersistor]),
          AuthnModule.forRoot([
            HotwireAuthnPlugin,
            NotImplementedAuthnPersistorPlugin,
            NotImplementedLocalAuthnPersistorPlugin,
            LocalAuthnPlugin,
            LocalAuthnPasswordPlugin,
          ]),
        ],
      },
      {
        beforeCompile: (module) => {
          return module.overrideProvider(LocalAuthnPersistorMock.provide).useValue(LocalAuthnPersistorMock.useValue);
        },
      },
    );

    findLocalIdentityMock = LocalAuthnPersistorMock.useValue.findLocalIdentity;
    localAuthnPasswordService = app.get(LocalAuthnPasswordService);
  });

  it('should create and validate a password', async ({ expect }) => {
    const password = makeUUID();
    const password3 = makeUUID();

    const hashed1 = localAuthnPasswordService.hashPassword(password);
    const hashed2 = localAuthnPasswordService.hashPassword(password);
    const hashed3 = localAuthnPasswordService.hashPassword(password3);
    expect(localAuthnPasswordService.validatePassword(password, hashed1)).toBe(true);
    expect(localAuthnPasswordService.validatePassword(password, hashed1)).toBe(true);
    expect(localAuthnPasswordService.validatePassword(password, hashed2)).toBe(true);
    expect(localAuthnPasswordService.validatePassword(password, hashed3)).toBe(false);
    expect(localAuthnPasswordService.validatePassword(password, hashed1 + 'ranom')).toBe(false);
    expect(localAuthnPasswordService.validatePassword(password, 'random' + hashed1)).toBe(false);
  });

  it('should create a local authn identity', async () => {
    findLocalIdentityMock.mock.mockImplementationOnce(async () => null);
    await localAuthnPasswordService.register({
      email: 'user+2@sad.com',
      password: 'password',
    });
  });
});
