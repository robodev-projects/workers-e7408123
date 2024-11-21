import { HttpStatus, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { beforeAll, describe, it } from 'vitest';

import { AuthnModule } from '~common/authn';
import { PrismaAuthnPersistorPlugin } from '~common/authn/persistors/prisma';
import { HotwireAuthnPlugin } from '~common/authn/providers/hotwire';
import { LocalAuthnPlugin } from '~common/authn/providers/local';
import { LocalAuthnPasswordPlugin } from '~common/authn/providers/local/passwords';
import { PrismaLocalAuthnPersistorPlugin } from '~common/authn/providers/local/persistors/prisma';
import { AuthnSessionPlugin } from '~common/authn/session';
import { KVStoreModule } from '~common/kvstore';
import { MemoryKVStorePlugin } from '~common/kvstore/providers/memory';
import { LoggerModule } from '~common/logger';
import { MediaModule, MediaService } from '~common/media';
import { MediaLoader } from '~common/media/media.loader';
import { PrismaMediaPersistorPlugin } from '~common/media/persistors/prisma';
import { MediaProviderMock } from '~common/media/tests/media.mock';

import { PrismaService } from '~database/prisma';
import { PrismaEphemeralModule } from '~database/prisma/prisma.ephemeral.module';

import { UserModule } from '~modules/user';
import { UserAccountModule } from '~modules/user/account';
import { UserSessionModule } from '~modules/user/session';
import { UserFixture } from '~modules/user/tests/user.fixture';
import { WorkersModule } from '~modules/workers/workers.module';

import { requestPipes } from '~app.pipes';
import { createBaseTestingModule } from '~test/utils';

describe('WorkerModule', () => {
  let app: INestApplication;
  let prismaClient: PrismaClient;

  beforeAll(async () => {
    app = await createBaseTestingModule(
      {
        imports: [
          LoggerModule,
          PrismaEphemeralModule,

          AuthnModule.forRoot([
            PrismaAuthnPersistorPlugin,
            AuthnSessionPlugin,

            HotwireAuthnPlugin,

            // local accounts
            LocalAuthnPlugin,
            PrismaLocalAuthnPersistorPlugin,
            LocalAuthnPasswordPlugin,
          ]),

          MediaModule.forRoot([PrismaMediaPersistorPlugin], { global: true }),
          KVStoreModule.forRoot([MemoryKVStorePlugin]),

          UserModule,
          UserAccountModule,
          UserSessionModule,
          WorkersModule,
        ],
      },
      {
        beforeInit: (app) => {
          requestPipes(app);
          return app;
        },
      },
    );

    app.get(MediaLoader).registerProvider('mock-provider', MediaProviderMock.useValue);
    app.get(MediaService).defaultProvider = MediaProviderMock.provider;

    prismaClient = app.get(PrismaService).client;
  });

  it('should create a worker', async () => {
    const user = await UserFixture.fromPartial({}, prismaClient);
    const {
      body: { accessToken: userAccessToken },
    } = await request(app.getHttpServer())
      .post('/account/session')
      .set('Authorization', user.authorizationHeader)
      .expect(HttpStatus.CREATED);

    // create worker
    await request(app.getHttpServer())
      .post('/workers')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        fullName: 'Jane Doe',
      })
      .expect(HttpStatus.CREATED);
  });

  it('should not create a worker with invalid data', async () => {
    const user = await UserFixture.fromPartial({}, prismaClient);
    const {
      body: { accessToken: userAccessToken },
    } = await request(app.getHttpServer())
      .post('/account/session')
      .set('Authorization', user.authorizationHeader)
      .expect(HttpStatus.CREATED);

    // attempt to create worker with missing fullName
    await request(app.getHttpServer())
      .post('/workers')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({})
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('should not create a worker without authorization', async () => {
    // attempt to create worker without authorization
    await request(app.getHttpServer())
      .post('/workers')
      .send({
        fullName: 'Unauthorized User',
      })
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should handle duplicate worker creation gracefully', async () => {
    const user = await UserFixture.fromPartial({}, prismaClient);
    const {
      body: { accessToken: userAccessToken },
    } = await request(app.getHttpServer())
      .post('/account/session')
      .set('Authorization', user.authorizationHeader)
      .expect(HttpStatus.CREATED);

    // create worker
    await request(app.getHttpServer())
      .post('/workers')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        fullName: 'Duplicate Worker',
      })
      .expect(HttpStatus.CREATED);

    // attempt to create the same worker again
    await request(app.getHttpServer())
      .post('/workers')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        fullName: 'Duplicate Worker',
      })
      .expect(HttpStatus.CREATED);
  });
});
