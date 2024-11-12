import { Injectable } from '@nestjs/common';

import { BadRequestException } from '~common/exceptions';
import { IPaginatedList } from '~common/http/pagination';
import { MediaService } from '~common/media';
import { makeUUID } from '~common/utils/short-uuid';

import { UserRole } from './user.constants';
import { UserRepository } from './user.repository';
import type { IUser, IUserCreate, IUserList, IUserUpdate } from './user.types';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly mediaService: MediaService,
  ) {}

  async paginate(query: IUserList): Promise<IPaginatedList<IUser>> {
    return await this.userRepository.paginate(query);
  }

  async find(where: { id: string }): Promise<IUser | null> {
    return await this.userRepository.find(where);
  }

  async create(data: IUserCreate): Promise<IUser> {
    const id = data.id || makeUUID();
    const roles = data.roles || [UserRole.USER];
    return await this.userRepository.create({ ...data, id, roles });
  }

  async update(where: { id: string }, data: IUserUpdate): Promise<IUser> {
    const user = await this.find(where);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    await this.validateMedia(user.id, data);
    return await this.userRepository.update(where, data);
  }

  private async validateMedia(userId: string, data: IUserUpdate): Promise<void> {
    if (data.profilePicture?.id) {
      const media = await this.mediaService.validate(data.profilePicture.id, `${userId}/profile-picture`);
      await this.mediaService.associate(media, {
        module: 'user',
        type: 'profile-picture',
        resourceId: userId,
      });
    }
  }

  public async resolveMedia<T = IUser | IUser[]>(user: T): Promise<T> {
    return this.mediaService.applyMediaFetchRequests(user, 'profilePicture');
  }
}
