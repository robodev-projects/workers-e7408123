import { Injectable } from '@nestjs/common';
import { Prisma, AuthnIdentity } from '@prisma/client';

import { PrismaService } from '~database/prisma';

import { AuthnIdentityPersistor } from '../../authn-identity-persistor.abstract';
import type { IAuthnIdentity, IAuthnIdentityCreate, IAuthnIdentityUpdate } from '../../authn.types';

@Injectable()
export class PrismaAuthnPersistor implements AuthnIdentityPersistor {
  private authnIdentity;

  constructor(private readonly prismaService: PrismaService) {
    this.authnIdentity = this.prismaService.client.authnIdentity;
  }

  private toIAuthnIdentity(authnIdentity: AuthnIdentity): IAuthnIdentity {
    return {
      id: authnIdentity.id,

      provider: authnIdentity.provider,
      providerId: authnIdentity.providerId,

      type: authnIdentity.type,
      userId: authnIdentity.userId,

      disabled: authnIdentity.disabled,

      createdAt: authnIdentity.createdAt,
    };
  }

  public async findIdentity(
    where: { id: string } | { provider: string; providerId: string },
  ): Promise<IAuthnIdentity | null> {
    const entity = await this.authnIdentity.findUnique({
      where: 'id' in where ? { id: where.id } : { provider_providerId: where },
    });
    return entity ? this.toIAuthnIdentity(entity) : null;
  }

  public async createIdentity(data: IAuthnIdentityCreate): Promise<IAuthnIdentity> {
    const entity = await this.authnIdentity.create({ data });
    return this.toIAuthnIdentity(entity);
  }

  public async updateIdentity(
    where: { id: string } | { provider: string; providerId: string },
    data: IAuthnIdentityUpdate,
  ): Promise<IAuthnIdentity> {
    if (!('id' in where) && !('provider' in where && 'providerId' in where)) {
      throw new Error('Invalid where parameter');
    }
    const entity = await this.authnIdentity.update({
      where: 'id' in where ? { id: where.id } : { provider_providerId: where },
      data,
    });
    return this.toIAuthnIdentity(entity);
  }

  public async deleteIdentity(where: {
    id?: string | string[];
    provider?: string | string[];
    providerId?: string | string[];
    type?: string | string[];
    userId?: string | string[];
  }): Promise<void> {
    const deleteWhere: Prisma.AuthnIdentityWhereInput = {};
    for (const [key, value] of Object.entries(where)) {
      switch (key) {
        case 'id':
        case 'provider':
        case 'providerId':
        case 'type':
        case 'userId':
          deleteWhere[key] = Array.isArray(value) ? { in: value } : value;
          break;
        default:
          throw new Error('Invalid where parameter');
      }
    }

    if (Object.keys(deleteWhere).length === 0) {
      throw new Error('No where parameter provided');
    }

    await this.authnIdentity.deleteMany({ where: deleteWhere });
    return;
  }
}
