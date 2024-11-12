import { AuthnIdentity, PrismaClient } from '@prisma/client';

import { makeId, makeUUID } from '~common/utils/short-uuid';

export class AuthnIdentityFixture {
  entity!: AuthnIdentity;
  authorizationHeader!: string;

  public static async fromPartial(data: Partial<AuthnIdentity>, prismaClient: PrismaClient) {
    const fixture = new AuthnIdentityFixture();

    fixture.entity = await prismaClient.authnIdentity.create({
      data: {
        provider: data.provider ?? 'hotwire',
        providerId: data.providerId ?? makeId(),
        type: data.type ?? 'user',
        userId: data.userId ?? makeUUID(),
        disabled: data.disabled,
      },
    });

    fixture.authorizationHeader = `Bearer {"provider":"${fixture.entity.provider}","providerId":"${fixture.entity.providerId}"}`;
    return fixture;
  }
}
