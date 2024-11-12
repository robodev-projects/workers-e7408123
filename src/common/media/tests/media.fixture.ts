import { Media, PrismaClient } from '@prisma/client';

import { makeUUID } from '~common/utils/short-uuid';

export class MediaFixture {
  entity!: Media;

  public static async fromPartial(data: Partial<Media>, prismaClient: PrismaClient) {
    const fixture = new MediaFixture();

    fixture.entity = await prismaClient.media.create({
      data: {
        key: data.key ?? makeUUID(),
        resourceName: data.resourceName ?? `mock-${makeUUID()}`,
        fileName: data.fileName ?? 'mock.png',
        mimeType: data.mimeType ?? 'image/png',
        fileSize: data.fileSize ?? 100,
        provider: 'mock-provider',
        id: data.id ?? makeUUID(),
      },
    });

    return fixture;
  }
}
