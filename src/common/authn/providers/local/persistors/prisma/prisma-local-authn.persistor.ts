import { Injectable } from '@nestjs/common';
import { Prisma, LocalAuthnIdentity } from '@prisma/client';

import { makeUUID } from '~common/utils/short-uuid';

import { PrismaService } from '~database/prisma';

import { LocalAuthnPersistor } from '../../local-authn-persistor.abstract';
import { ILocalAuthnIdentity, ILocalAuthnIdentityCreate, ILocalAuthnIdentityUpdate } from '../../local-authn.types';

@Injectable()
export class PrismaLocalAuthnPersistor implements LocalAuthnPersistor {
  private localAuthnIdentity;

  constructor(private readonly prismaService: PrismaService) {
    this.localAuthnIdentity = this.prismaService.client.localAuthnIdentity;
  }

  private toILocalAuthnIdentity(localIdentity: LocalAuthnIdentity): ILocalAuthnIdentity {
    return {
      id: localIdentity.id,

      email: localIdentity.email,
      password: localIdentity.password || undefined,

      magicLinkCode: localIdentity.magicLinkCode || undefined,
      magicLinkCodeExpiresAt: localIdentity.magicLinkCodeExpiresAt || undefined,

      disabled: localIdentity.disabled,
      validated: localIdentity.validated,

      createdAt: localIdentity.createdAt,
    };
  }

  public async findLocalIdentity(where: { id: string } | { email: string }): Promise<ILocalAuthnIdentity | null> {
    const entity = await this.localAuthnIdentity.findUnique({ where });
    return entity ? this.toILocalAuthnIdentity(entity) : null;
  }

  public async createLocalIdentity(data: ILocalAuthnIdentityCreate): Promise<ILocalAuthnIdentity> {
    const entity = await this.localAuthnIdentity.create({ data: { id: makeUUID(), ...data } });
    return this.toILocalAuthnIdentity(entity);
  }

  public async updateLocalIdentity(
    where: { id: string } | { email: string },
    data: ILocalAuthnIdentityUpdate,
  ): Promise<ILocalAuthnIdentity> {
    if (!('id' in where) || !where.id) {
      throw new Error('Invalid where parameter');
    }
    const entity = await this.localAuthnIdentity.update({ where, data });
    return this.toILocalAuthnIdentity(entity);
  }

  public async deleteLocalIdentity(where: { id?: string | string[]; email: string | string[] }): Promise<void> {
    const deleteWhere: Prisma.LocalAuthnIdentityWhereInput = {};
    for (const [key, value] of Object.entries(where)) {
      switch (key) {
        case 'id':
        case 'email':
          deleteWhere[key] = Array.isArray(value) ? { in: value } : (value as string);
          break;
        default:
          throw new Error('Invalid where parameter');
      }
    }

    if (Object.keys(deleteWhere).length === 0) {
      throw new Error('No where parameter provided');
    }

    await this.localAuthnIdentity.deleteMany({ where: deleteWhere });
    return;
  }
}
