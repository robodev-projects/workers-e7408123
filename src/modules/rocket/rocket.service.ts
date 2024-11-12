import { Injectable } from '@nestjs/common';

import { BadRequestException } from '~common/exceptions';
import { IPaginatedList } from '~common/http/pagination';
import { MediaService } from '~common/media';
import { makeUUID } from '~common/utils/short-uuid';

import { MediaLibrary } from '~modules/media-library';

import { RocketRepository } from './rocket.repository';
import type { IRocket, IRocketCreate, IRocketList, IRocketUpdate } from './rocket.types';

@Injectable()
export class RocketService {
  constructor(
    private readonly rocketRepository: RocketRepository,
    private readonly mediaService: MediaService,
  ) {}

  async paginate(query: IRocketList): Promise<IPaginatedList<IRocket>> {
    return await this.rocketRepository.paginate(query);
  }

  async find(where: { id: string }): Promise<IRocket | null> {
    return this.rocketRepository.find(where);
  }

  async create(data: IRocketCreate): Promise<IRocket> {
    const id = data.id || makeUUID();
    return await this.rocketRepository.create({ ...data, id });
  }

  async update(id: string, data: IRocketUpdate): Promise<IRocket> {
    const rocket = await this.find({ id });
    if (!rocket) {
      throw new BadRequestException('Rocket not found');
    }
    await this.validateMedia(rocket.id, data);
    return await this.rocketRepository.update(id, data);
  }

  /**
   * Validate and associate media to the rocket
   */
  private async validateMedia(rocketId: string, data: IRocketUpdate): Promise<void> {
    if (data.picture?.id) {
      const media = await this.mediaService.validate(data.picture.id, MediaLibrary.SmallImage);
      await this.mediaService.associate(media, {
        module: 'rocket',
        type: 'rocket-picture',
        resourceId: rocketId,
      });
    }
    if (data.timelapses) {
      for (const { id } of data.timelapses) {
        // validate can take some time to fetch the media
        const media = await this.mediaService.validate(id, MediaLibrary.SmallImage);
        await this.mediaService.associate(media, {
          module: 'rocket',
          type: 'rocket-timelapse',
          resourceId: rocketId,
        });
      }
    }
  }

  /**
   * Apply media fetch requests to the rocket
   */
  public async resolveMedia<T extends IRocket[] | IRocket>(rocket: T): Promise<T> {
    const rockets: IRocket[] = Array.isArray(rocket) ? rocket : [rocket];

    const pictureIds: string[] = rockets
      .map((r) => [r.picture?.id, ...(r.timelapses ?? []).map((x) => x.id)])
      .flat()
      .filter((x) => x !== undefined);

    const mediaRequests = await this.mediaService.createMediaFetchRequests(pictureIds);

    for (const rocket of rockets) {
      if (rocket.picture?.id && mediaRequests[rocket.picture?.id])
        rocket.picture = { ...mediaRequests[rocket.picture?.id] };
      if (rocket.timelapses)
        rocket.timelapses = rocket.timelapses.map((t) => {
          return t.id && mediaRequests[t.id] ? { ...t, ...mediaRequests[t.picture?.id] } : t;
        });
    }

    return Array.isArray(rocket) ? (rockets as T) : (rockets[0] as T);
  }
}
