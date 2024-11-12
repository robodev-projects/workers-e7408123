import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { IPaginatedList } from '~common/http/pagination';

import { PrismaService, generatePaginationOrderByPrisma } from '~database/prisma';

import type { UserRole } from './user.constants';
import type { IUser, IUserCreate, IUserList, IUserUpdate } from './user.types';

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async paginate(query: IUserList): Promise<IPaginatedList<IUser>> {
    const { page, limit } = query;
    const where: Prisma.UserWhereInput = {};

    if (query.filter) {
      for (const key of Object.keys(query.filter)) {
        switch (key) {
          case 'ids':
            where.id = { in: query.filter.ids };
            break;
          case 'email':
            where.email = { contains: query.filter.email, mode: 'default' };
            break;
        }
      }
    }

    const orderBy = generatePaginationOrderByPrisma(query.order);
    const offset = (page - 1) * limit;
    const items = await this.prismaService.client.user.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy,
    });
    const count = await this.prismaService.client.user.count({ where });

    return {
      items: items.map((user) => UserRepository.toIUser(user)),
      page,
      limit,
      totalItems: count,
    };
  }

  async find(where: { id: string }): Promise<IUser | null> {
    const entity = await this.prismaService.client.user.findUnique({
      where,
    });

    if (!entity) {
      return null;
    }

    return UserRepository.toIUser(entity);
  }

  async create(data: IUserCreate): Promise<IUser> {
    const user = await this.prismaService.client.user.create({
      data,
    });

    return UserRepository.toIUser(user);
  }

  async update(where: { id: string }, data: IUserUpdate): Promise<IUser> {
    const user = await this.prismaService.client.user.update({
      where,
      data: {
        email: data.email,
        name: data.name,
        roles: data.roles,
        profilePictureId: data.profilePicture?.id,
      },
    });

    return UserRepository.toIUser(user);
  }

  private static toIUser(data: User): IUser {
    return {
      id: data.id,
      email: data.email || undefined,
      name: data.name || undefined,
      roles: (data.roles as UserRole[]) || [],
      profilePicture: data.profilePictureId ? { id: data.profilePictureId } : undefined,
      createdAt: data.createdAt,
    };
  }
}
