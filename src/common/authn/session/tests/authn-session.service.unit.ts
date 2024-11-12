import { Controller, Get, type INestApplication, MiddlewareConsumer, Module } from '@nestjs/common';
import request from 'supertest';
import { beforeAll, describe, it } from 'vitest';

import { Authenticated, AuthnIdentity, AuthnMiddleware, IAuthnIdentity } from '~common/authn';
import { NotImplementedAuthnPersistorPlugin } from '~common/authn/persistors/not-implemented';
import { HotwireAuthnPlugin } from '~common/authn/providers/hotwire';
import { AuthnSessionPlugin } from '~common/authn/session';
import { KVStoreModule } from '~common/kvstore';
import { MemoryKVStorePlugin } from '~common/kvstore/providers/memory';
import { LoggerModule } from '~common/logger';
import { makeUUID } from '~common/utils/short-uuid';

import { createBaseTestingModule } from '~test/utils';

import { AuthnModule } from '../../authn.module';
import { AuthnSessionProvider } from '../authn-session.provider';

@Controller()
class TestController {
  @Authenticated()
  @Get('test-endpoint')
  get(@AuthnIdentity() authn: IAuthnIdentity) {
    return authn;
  }
}

@Module({})
export class TestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthnMiddleware()).forRoutes('*');
  }
}

describe('AuthnSession', () => {
  let app: INestApplication;
  let authnSessionProvider: AuthnSessionProvider;

  beforeAll(async () => {
    app = await createBaseTestingModule({
      imports: [
        LoggerModule,
        KVStoreModule.forRoot([MemoryKVStorePlugin]),
        AuthnModule.forRoot([NotImplementedAuthnPersistorPlugin, HotwireAuthnPlugin, AuthnSessionPlugin]),
        TestModule,
      ],
      controllers: [TestController],
    });

    authnSessionProvider = app.get(AuthnSessionProvider);
  });

  it('should persist session', async ({ expect }) => {
    const {
      refreshToken,
      refreshTokenData,
      session: originalSession,
    } = await authnSessionProvider.createSession(
      {
        userId: makeUUID(),
        authnId: makeUUID(),
        userType: 'test',
      },
      {
        // session payload
        spl: 'test1',
      },
      {
        // token payload
        tpl: 'test2',
      },
    );
    const { session, token } = await authnSessionProvider.resolveSession(refreshToken, 'session:refresh');
    expect(session).toEqual(originalSession);
    expect(session.userId).toEqual(refreshTokenData.uid);
    expect(session.sessionId).toEqual(refreshTokenData.sid);
    expect(session.payload.spl).toEqual('test1');
    expect(token.tpl).toEqual('test2');
  });

  it('should resolve session', async ({ expect }) => {
    const { session } = await authnSessionProvider.createSession(
      {
        userId: makeUUID(),
        authnId: makeUUID(),
        userType: 'test',
      },
      {
        random: 'data',
      },
    );

    const { accessToken, accessTokenData } = await authnSessionProvider.createAccessToken(session);

    const response = await request(app.getHttpServer())
      .get('/test-endpoint')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.providerData.session).toEqual(session);
    expect(response.body.providerData.token).toEqual(accessTokenData);
  });
});
