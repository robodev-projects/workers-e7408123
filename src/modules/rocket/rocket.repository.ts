import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { IPaginatedList } from '~common/http/pagination';

import { PrismaService, generatePaginationOrderByPrisma } from '~database/prisma';

import type { IRocket, IRocketCreate, IRocketList, IRocketUpdate } from './rocket.types';

type RocketWithTimelapses = Prisma.RocketGetPayload<{
  include: {
    timelapses: {
      select: {
        pictureId: true;
      };
    };
  };
}>;

@Injectable()
export class RocketRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async paginate(query: IRocketList): Promise<IPaginatedList<IRocket>> {
    const { page, limit } = query;
    const where: Prisma.RocketWhereInput = {};

    if (query.filter) {
      for (const key of Object.keys(query.filter)) {
        switch (key) {
          case 'ids':
            where.id = { in: query.filter.ids };
            break;
          case 'name':
          case 'model':
            where[key] = query.filter[key];
            break;
          case 'search':
            where.OR = [
              //
              { name: { contains: query.filter.search } },
              { model: { contains: query.filter.search } },
            ];
            break;
        }
      }
    }

    const orderBy = generatePaginationOrderByPrisma(query.order);
    const offset = (page - 1) * limit;
    const items = await this.prismaService.client.rocket.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy,
      include: {
        timelapses: {
          select: {
            pictureId: true,
          },
        },
      },
    });
    const count = await this.prismaService.client.rocket.count({ where });

    return {
      items: items.map((x) => RocketRepository.toDomain(x)),
      page,
      limit,
      totalItems: count,
    };
  }

  async find(where: { id: string }): Promise<IRocket | null> {
    const entity = await this.prismaService.client.rocket.findUnique({
      where: { id: where.id },
      include: {
        timelapses: {
          select: {
            pictureId: true,
          },
        },
      },
    });

    if (!entity) {
      return null;
    }

    return RocketRepository.toDomain(entity);
  }

  async create(data: IRocketCreate): Promise<IRocket> {
    const entity = await this.prismaService.client.rocket.create({
      data,
      include: {
        timelapses: {
          select: {
            pictureId: true,
          },
        },
      },
    });
    return RocketRepository.toDomain(entity);
  }

  async update(id: string, data: IRocketUpdate): Promise<IRocket> {
    const entity = await this.prismaService.client.rocket.update({
      where: {
        id,
      },
      data: {
        ...data,
        pictureId: data.picture?.id,
        timelapses: {
          // create associated timelapses
          connectOrCreate: data.timelapses?.map((x) => ({ where: { pictureId: x.id }, create: { pictureId: x.id } })),
          // delete timelapses not in the list
          deleteMany: {
            pictureId: {
              notIn: data.timelapses?.map((x) => x.id),
            },
          },
        },
      },
      include: {
        timelapses: true,
      },
    });
    return RocketRepository.toDomain(entity);
  }

  public static toDomain(data: RocketWithTimelapses): IRocket {
    return {
      id: data.id,
      name: data.name,
      model: data.model,
      picture: data.pictureId ? { id: data.pictureId } : undefined,
      timelapses: data.timelapses ? data.timelapses.map((x) => ({ id: x.pictureId })) : [],
    };
  }
}
