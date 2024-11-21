import { PrismaClient, User } from '@prisma/client';

import { makeUUID } from '~common/utils/short-uuid';

export class UserFixture {
  entity!: User;
  authorizationHeader!: string;

  public static async fromPartial(data: Partial<User>, prismaClient: PrismaClient) {
    const fixture = new UserFixture();

    fixture.entity = await prismaClient.user.create({
      data: {
        ...data,
        id: data.id ?? makeUUID(),
        email: data.email ?? 'user@example.com',
        name: data.name ?? 'John Doe',
        roles: data.roles ?? ['user'],
      },
    });

    fixture.authorizationHeader = `Bearer {"type":"user","userId":"${fixture.entity.id}"}`;
    return fixture;
  }
}
