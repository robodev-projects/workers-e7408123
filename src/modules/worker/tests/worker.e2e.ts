import { HttpStatus, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { beforeAll, describe, it } from 'vitest';

import { PrismaService } from '~database/prisma';

import { UserFixture } from '~modules/user/tests/user.fixture';
import { WorkersModule } from '~modules/workers/workers.module';

import { createAppTestingModule } from '~test/utils/app.testing-module';

describe('WorkerModule', () => {
  let app: INestApplication;
  let prismaClient: PrismaClient;

  beforeAll(async () => {
    app = await createAppTestingModule({
      imports: [WorkersModule],
    });

    prismaClient = app.get(PrismaService).client;
  });

  it('should create a worker', async () => {
    const user = await UserFixture.fromPartial({}, prismaClient);
    // create worker

    await request(app.getHttpServer())
      .post('/workers')
      .set('Authorization', user.authorizationHeader)
      .send({
        fullName: 'Jane Doe',
      })
      .expect(HttpStatus.CREATED);
  });

  it('should not create a worker with invalid data', async () => {
    const user = await UserFixture.fromPartial({}, prismaClient);

    // attempt to create worker with missing fullName
    await request(app.getHttpServer())
      .post('/workers')
      .set('Authorization', user.authorizationHeader)
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

    // create worker
    await request(app.getHttpServer())
      .post('/workers')
      .set('Authorization', user.authorizationHeader)
      .send({
        fullName: 'Duplicate Worker',
      })
      .expect(HttpStatus.CREATED);

    // attempt to create the same worker again
    await request(app.getHttpServer())
      .post('/workers')
      .set('Authorization', user.authorizationHeader)
      .send({
        fullName: 'Duplicate Worker',
      })
      .expect(HttpStatus.CREATED);
  });
});
