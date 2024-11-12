import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeAll, describe, it } from 'vitest';

import { AuthnConfig } from '~common/authn/authn.config';
import { getConfigFactory } from '~common/config';

import { AuthnTokenService } from '../authn-token.service';

describe('AuthnToken', () => {
  let app: INestApplication;
  let authnJWTService: AuthnTokenService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [getConfigFactory(AuthnConfig), AuthnTokenService],
    }).compile();

    authnJWTService = moduleRef.get(AuthnTokenService);
    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('should sign and verify an AuthnToken', async ({ expect }) => {
    const [token] = await authnJWTService.createToken(
      {},
      { expiresAt: Math.floor(Date.now() / 1000) + 60 * 5, audience: 'test' },
    );

    expect(await authnJWTService.verifyToken(token, { audience: 'test' })).toEqual(
      expect.objectContaining({ aud: 'test' }),
    );

    expect(await authnJWTService.verifyToken(token + 'random', { audience: 'test' })).toEqual(null);
  });
});
