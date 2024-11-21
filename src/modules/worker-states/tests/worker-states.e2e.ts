import { HttpStatus, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

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
import { WorkerStatesModule } from '~modules/worker-states/worker-states.module';
import { WorkersModule } from '~modules/workers/workers.module';

import { requestPipes } from '~app.pipes';
import { createBaseTestingModule } from '~test/utils';

describe('WorkerStatesModule', () => {
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
          WorkerStatesModule,
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

  it('should create a worker state', async () => {
    const user = await UserFixture.fromPartial({}, prismaClient);
    const {
      body: { accessToken: userAccessToken },
    } = await request(app.getHttpServer())
      .post('/account/session')
      .set('Authorization', user.authorizationHeader)
      .expect(HttpStatus.CREATED);

    // create worker state ASSIGNED
    const assignedResponse = await request(app.getHttpServer())
      .post(`/workers/${user.entity.id}/states`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        state: 'ASSIGNED',
        createdAt: new Date(),
      })
      .expect(HttpStatus.CREATED);

    expect(assignedResponse.body).toHaveProperty('id');
    expect(assignedResponse.body.state).toBe('ASSIGNED');

    // create worker state UNASSIGNED
    const unassignedResponse = await request(app.getHttpServer())
      .post(`/workers/${user.entity.id}/states`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        state: 'UNASSIGNED',
        createdAt: new Date(),
      })
      .expect(HttpStatus.CREATED);

    expect(unassignedResponse.body).toHaveProperty('id');
    expect(unassignedResponse.body.state).toBe('UNASSIGNED');
  });

  it('should get states of a worker', async () => {
    const user = await UserFixture.fromPartial({}, prismaClient);
    const {
      body: { accessToken: userAccessToken },
    } = await request(app.getHttpServer())
      .post('/account/session')
      .set('Authorization', user.authorizationHeader)
      .expect(HttpStatus.CREATED);

    // get worker states
    const statesResponse = await request(app.getHttpServer())
      .get(`/workers/${user.entity.id}/states`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(HttpStatus.OK);

    expect(Array.isArray(statesResponse.body.states)).toBe(true);
    expect(statesResponse.body.states.length).toBe(0);
    statesResponse.body.states.forEach((state: any) => {
      expect(state).toHaveProperty('id');
      expect(state).toHaveProperty('state');
    });
  });

  it('should get work reports of a worker', async () => {
    const user = await UserFixture.fromPartial({}, prismaClient);
    const {
      body: { accessToken: userAccessToken },
    } = await request(app.getHttpServer())
      .post('/account/session')
      .set('Authorization', user.authorizationHeader)
      .expect(HttpStatus.CREATED);

    // get work reports
    const reportsResponse = await request(app.getHttpServer())
      .get(`/workers/${user.entity.id}/work-reports?from=2023-01-01&to=2023-12-31`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(HttpStatus.OK);

    expect(Array.isArray(reportsResponse.body.timePairs)).toBe(true);
    reportsResponse.body.timePairs.forEach((report: any) => {
      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('date');
      expect(report).toHaveProperty('totalSeconds');
    });
  });

  it('should handle ASSIGN and UNASSIGN within an hour', async () => {
    const user = await UserFixture.fromPartial({}, prismaClient);
    const {
      body: { accessToken: userAccessToken },
    } = await request(app.getHttpServer())
      .post('/account/session')
      .set('Authorization', user.authorizationHeader)
      .expect(HttpStatus.CREATED);

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 3600 * 1000);

    // ASSIGN
    await request(app.getHttpServer())
      .post(`/workers/${user.entity.id}/states`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        state: 'ASSIGNED',
        createdAt: now,
      })
      .expect(HttpStatus.CREATED);

    // UNASSIGN
    await request(app.getHttpServer())
      .post(`/workers/${user.entity.id}/states`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        state: 'UNASSIGNED',
        createdAt: oneHourLater,
      })
      .expect(HttpStatus.CREATED);

    // Verify report
    const beginningOfDay = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const endOfDay = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2);
    console.log(
      `/workers/${user.entity.id}/work-reports?from=${beginningOfDay.toISOString()}&to=${endOfDay.toISOString()}`,
    );
    const reportResponse = await request(app.getHttpServer())
      .get(`/workers/${user.entity.id}/work-reports?from=${beginningOfDay.toISOString()}&to=${endOfDay.toISOString()}`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(HttpStatus.OK);

    expect(reportResponse.body.totalSeconds).toBe(3600);
  });

  it('should handle cross-day ASSIGN and UNASSIGN', async () => {
    const user = await UserFixture.fromPartial({}, prismaClient);
    const {
      body: { accessToken: userAccessToken },
    } = await request(app.getHttpServer())
      .post('/account/session')
      .set('Authorization', user.authorizationHeader)
      .expect(HttpStatus.CREATED);

    const assignTime = new Date();
    assignTime.setHours(23, 0, 0, 0);
    const unassignTime = new Date(assignTime);
    unassignTime.setHours(2, 0, 0, 0);
    unassignTime.setDate(unassignTime.getDate() + 1);

    // ASSIGN
    await request(app.getHttpServer())
      .post(`/workers/${user.entity.id}/states`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        state: 'ASSIGNED',
        createdAt: assignTime,
      })
      .expect(HttpStatus.CREATED);

    // UNASSIGN
    await request(app.getHttpServer())
      .post(`/workers/${user.entity.id}/states`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        state: 'UNASSIGNED',
        createdAt: unassignTime,
      })
      .expect(HttpStatus.CREATED);

    // Verify report for both days
    const beginningOfDay = new Date(assignTime.getUTCFullYear(), assignTime.getUTCMonth(), assignTime.getUTCDate());
    const endOfDay = new Date(assignTime.getUTCFullYear(), assignTime.getUTCMonth(), assignTime.getUTCDate() + 2);
    const reportResponse = await request(app.getHttpServer())
      .get(`/workers/${user.entity.id}/work-reports?from=${beginningOfDay.toISOString()}&to=${endOfDay.toISOString()}`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(HttpStatus.OK);

    expect(reportResponse.body.totalSeconds).toBe(3 * 3600);
  });

  it('should handle multiple ASSIGN and UNASSIGN within a day', async () => {
    const user = await UserFixture.fromPartial({}, prismaClient);
    const {
      body: { accessToken: userAccessToken },
    } = await request(app.getHttpServer())
      .post('/account/session')
      .set('Authorization', user.authorizationHeader)
      .expect(HttpStatus.CREATED);

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 3600 * 1000);
    const twoHoursLater = new Date(now.getTime() + 2 * 3600 * 1000);
    const threeHoursLater = new Date(now.getTime() + 3 * 3600 * 1000);

    // ASSIGN
    await request(app.getHttpServer())
      .post(`/workers/${user.entity.id}/states`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        state: 'ASSIGNED',
        createdAt: now,
      })
      .expect(HttpStatus.CREATED);

    // ASSIGN again
    await request(app.getHttpServer())
      .post(`/workers/${user.entity.id}/states`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        state: 'ASSIGNED',
        createdAt: oneHourLater,
      })
      .expect(HttpStatus.CREATED);

    // UNASSIGN
    await request(app.getHttpServer())
      .post(`/workers/${user.entity.id}/states`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        state: 'UNASSIGNED',
        createdAt: twoHoursLater,
      })
      .expect(HttpStatus.CREATED);

    // UNASSIGN again
    await request(app.getHttpServer())
      .post(`/workers/${user.entity.id}/states`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        state: 'UNASSIGNED',
        createdAt: threeHoursLater,
      })
      .expect(HttpStatus.CREATED);

    // Verify report
    const beginningOfDay = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const endOfDay = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2);
    const reportResponse = await request(app.getHttpServer())
      .get(`/workers/${user.entity.id}/work-reports?from=${beginningOfDay.toISOString()}&to=${endOfDay.toISOString()}`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(HttpStatus.OK);

    expect(reportResponse.body.totalSeconds).toBe(3600);
  });

  it('should handle cross-day ASSIGN and UNASSIGN', async () => {
    const user = await UserFixture.fromPartial({}, prismaClient);
    const {
      body: { accessToken: userAccessToken },
    } = await request(app.getHttpServer())
      .post('/account/session')
      .set('Authorization', user.authorizationHeader)
      .expect(HttpStatus.CREATED);

    const assignTime = new Date();
    assignTime.setHours(23, 0, 0, 0);
    const unassignTime = new Date(assignTime);
    unassignTime.setHours(2, 0, 0, 0);
    unassignTime.setDate(unassignTime.getDate() + 1);

    // ASSIGN
    await request(app.getHttpServer())
      .post(`/workers/${user.entity.id}/states`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        state: 'ASSIGNED',
        createdAt: assignTime,
      })
      .expect(HttpStatus.CREATED);

    // UNASSIGN
    await request(app.getHttpServer())
      .post(`/workers/${user.entity.id}/states`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        state: 'UNASSIGNED',
        createdAt: unassignTime,
      })
      .expect(HttpStatus.CREATED);

    // Verify report for both days
    const beginningOfDay = new Date(assignTime.getUTCFullYear(), assignTime.getUTCMonth(), assignTime.getUTCDate());
    const endOfDayOne = new Date(assignTime.getUTCFullYear(), assignTime.getUTCMonth(), assignTime.getUTCDate() + 1);
    const endOfDayTwo = new Date(assignTime.getUTCFullYear(), assignTime.getUTCMonth(), assignTime.getUTCDate() + 2);
    const reportResponseDayOne = await request(app.getHttpServer())
      .get(
        `/workers/${user.entity.id}/work-reports?from=${beginningOfDay.toISOString()}&to=${endOfDayOne.toISOString()}`,
      )
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(HttpStatus.OK);

    expect(reportResponseDayOne.body.totalSeconds).toBe(1 * 3600);

    const reportResponseDayTwo = await request(app.getHttpServer())
      .get(`/workers/${user.entity.id}/work-reports?from=${endOfDayOne.toISOString()}&to=${endOfDayTwo.toISOString()}`)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(HttpStatus.OK);

    expect(reportResponseDayTwo.body.totalSeconds).toBe(2 * 3600);
  });
});
