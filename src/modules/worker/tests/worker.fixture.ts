import { PrismaClient, Worker } from '@prisma/client';

import { makeUUID } from '~common/utils/short-uuid';

export class WorkerFixture {
  entity!: Worker;
  authorizationHeader!: string;

  public static async fromPartial(data: Partial<Worker>, prismaClient: PrismaClient) {
    const fixture = new WorkerFixture();

    fixture.entity = await prismaClient.worker.create({
      data: {
        ...data,
        id: data.id ?? makeUUID(),
        fullName: data.fullName ?? 'Jane Doe',
      },
    });

    fixture.authorizationHeader = `Bearer {"type":"worker","workerId":"${fixture.entity.id}"}`;
    return fixture;
  }
}
