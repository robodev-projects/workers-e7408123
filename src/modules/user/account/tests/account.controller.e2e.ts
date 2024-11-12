import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, it } from 'vitest';

import { AuthnIdentityFixture } from '~common/authn/persistors/prisma/tests/authn-identity.fixture';

import { PrismaService } from '~database/prisma';

import { UserFixture } from '~modules/user/tests/user.fixture';

import { createAppTestingModule } from '~test/utils';

describe('AccountController', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    app = await createAppTestingModule();
    prismaService = app.get(PrismaService);
  });

  it('should register a new user', async ({ expect }) => {
    const response = await request(app.getHttpServer())
      .post('/account/register')
      .set('Authorization', `Bearer {"providerId": "7b8775ae-e687-491a-8e6b-eb6707f4ef43","name":"John Doe"}`)
      .send({
        email: 'john@example.com',
        // name: 'John Doe',
      })

      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        email: 'john@example.com',
        name: 'John Doe',
      }),
    );
  });

  it('should get user data', async ({ expect }) => {
    const userFixture = await UserFixture.fromPartial(
      {
        email: 'john@example.com',
        name: 'John Doe',
      },
      prismaService.client,
    );

    const response = await request(app.getHttpServer())
      .get('/account')
      .set('Authorization', userFixture.authorizationHeader)
      .send()
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        email: 'john@example.com',
        name: 'John Doe',
      }),
    );
  });

  it('should resolve user from authnIdentity', async ({ expect }) => {
    const authnIdentityFixture = await AuthnIdentityFixture.fromPartial(
      {
        type: 'user',
        userId: '7b8775ae-e687-491a-8e6b-eb6707f4ef43',
      },
      prismaService.client,
    );

    const userFixture = await UserFixture.fromPartial(
      {
        id: authnIdentityFixture.entity.userId,
        email: 'johny@example.com',
        name: 'John P. Doe',
      },
      prismaService.client,
    );

    const response = await request(app.getHttpServer())
      .get('/account')
      .set('Authorization', authnIdentityFixture.authorizationHeader)
      .send()
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        email: userFixture.entity.email,
        name: userFixture.entity.name,
      }),
    );
  });
});
