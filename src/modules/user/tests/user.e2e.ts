import { Controller, Get, HttpStatus, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { beforeAll, describe, it } from 'vitest';

import { AuthnModule } from '~common/authn';
import { PrismaAuthnPersistorPlugin } from '~common/authn/persistors/prisma';
import { HotwireAuthnPlugin } from '~common/authn/providers/hotwire';
import { LocalAuthnPlugin } from '~common/authn/providers/local';
import { LocalAuthnPasswordPlugin } from '~common/authn/providers/local/passwords';
import { PrismaLocalAuthnPersistorPlugin } from '~common/authn/providers/local/persistors/prisma';
import { AuthnSessionPlugin, SessionPayload } from '~common/authn/session';
import { KVStoreModule } from '~common/kvstore';
import { MemoryKVStorePlugin } from '~common/kvstore/providers/memory';
import { LoggerModule } from '~common/logger';
import { MediaModule, MediaService } from '~common/media';
import { MediaLoader } from '~common/media/media.loader';
import { PrismaMediaPersistorPlugin } from '~common/media/persistors/prisma';
import { exampleMedia, MediaProviderMock } from '~common/media/tests/media.mock';

import { PrismaService } from '~database/prisma';
import { PrismaEphemeralModule } from '~database/prisma/prisma.ephemeral.module';

import { AuthorizedUser, UserModule } from '~modules/user';
import { UserAccountModule } from '~modules/user/account';
import { UserSessionModule, IUserSessionPayload } from '~modules/user/session';
import { UserFixture } from '~modules/user/tests/user.fixture';

import { requestPipes } from '~app.pipes';
import { createBaseTestingModule } from '~test/utils';

@Controller('test')
@AuthorizedUser({ roles: ['staff'] })
export class TestController {
  @Get('staff')
  async staff(@SessionPayload() session: IUserSessionPayload): Promise<void> {
    if (!session.roles.includes('staff')) {
      throw new Error('Not staff');
    }
  }
}

describe('UserModule', () => {
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
        ],
        controllers: [TestController],
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

  it('should register a user and access an endpoint', async ({ expect }) => {
    // register user
    const {
      body: { accessToken: authnAccessToken },
    } = await request(app.getHttpServer())
      .post('/auth/provider/local/register')
      .send({
        email: 'user@example.com',
        password: 'password123456',
      })
      .expect(HttpStatus.CREATED);

    // cant create session without account
    await request(app.getHttpServer())
      .post('/account/session')
      .set('Authorization', `Bearer ${authnAccessToken}`)
      .expect(HttpStatus.FORBIDDEN);

    // create account
    await request(app.getHttpServer())
      .post('/account/register')
      .set('Authorization', `Bearer ${authnAccessToken}`)
      .send({
        name: 'User',
      })
      .expect(HttpStatus.CREATED);

    // session creation should work now
    const {
      body: { accessToken: sessionAccessToken, refreshToken: sessionRefreshToken },
    } = await request(app.getHttpServer())
      .post('/account/session')
      .set('Authorization', `Bearer ${authnAccessToken}`)
      .expect(HttpStatus.CREATED);

    const {
      body: { name },
    } = await request(app.getHttpServer())
      .get('/account')
      .set('Authorization', `Bearer ${sessionAccessToken}`)
      .expect(HttpStatus.OK);

    expect(name).toBe('User');

    // get new token
    const {
      body: { accessToken: newSessionAccessToken },
    } = await request(app.getHttpServer())
      .post('/account/session/refresh')
      .send({ refreshToken: sessionRefreshToken })
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .get('/account')
      .set('Authorization', `Bearer ${newSessionAccessToken}`)
      .expect(HttpStatus.OK);

    // upload profile picture

    const {
      body: { id },
    } = await request(app.getHttpServer())
      .post('/account/upload-request')
      .set('Authorization', `Bearer ${sessionAccessToken}`)
      .send({
        resourceName: 'profilePicture',
        fileName: exampleMedia.fileName,
        fileSize: exampleMedia.fileSize,
      })
      .expect(HttpStatus.CREATED);

    // update user
    const {
      body: {
        profilePicture: { url },
      },
    } = await request(app.getHttpServer())
      .put('/account')
      .set('Authorization', `Bearer ${sessionAccessToken}`)
      .send({
        profilePicture: { id },
      })
      .expect(HttpStatus.OK);

    expect(url).toBeDefined();
  });

  it('should protect endpoint by role', async () => {
    const user = await UserFixture.fromPartial({ roles: ['user'] }, prismaClient);
    const staff = await UserFixture.fromPartial({ roles: ['staff'] }, prismaClient);

    const {
      body: { accessToken: userAccessToken },
    } = await request(app.getHttpServer()).post('/account/session').set('Authorization', user.authorizationHeader);

    const {
      body: { accessToken: staffAccessToken },
    } = await request(app.getHttpServer()).post('/account/session').set('Authorization', staff.authorizationHeader);

    await request(app.getHttpServer())
      .get('/test/staff')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(HttpStatus.FORBIDDEN);

    await request(app.getHttpServer())
      .get('/test/staff')
      .set('Authorization', `Bearer ${staffAccessToken}`)
      .expect(HttpStatus.OK);
  });
});
