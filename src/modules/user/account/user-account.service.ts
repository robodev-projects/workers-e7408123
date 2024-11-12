import { Injectable } from '@nestjs/common';

import { AuthnService, IAuthnProviderIdentity } from '~common/authn';
import { BadRequestException } from '~common/exceptions';
import { makeUUID } from '~common/utils/short-uuid';

import type { IUserUpdate } from '~modules/user';

import { USER_AUTHN_KEY } from '../user.constants';
import { UserService } from '../user.service';
import { IUserAccount, IUserAccountCreate } from './user-account.types';

@Injectable()
export class UserAccountService {
  constructor(
    private readonly userService: UserService,
    private readonly authnService: AuthnService,
  ) {}

  public async find(where: { id: string }): Promise<IUserAccount | null> {
    return this.userService.find(where);
  }

  public async update(where: { id: string }, data: IUserUpdate): Promise<IUserAccount> {
    return this.userService.update(where, data);
  }

  public async resolveMedia(user: IUserAccount): Promise<IUserAccount> {
    return this.userService.resolveMedia(user);
  }

  async create(auth: IAuthnProviderIdentity, userData: IUserAccountCreate): Promise<IUserAccount> {
    let authnIdentity = await this.authnService.findIdentity({
      provider: auth.provider,
      providerId: auth.providerId,
    });
    if (authnIdentity) {
      if (!authnIdentity.userId) {
        throw new Error('AuthnIdentity missing userId');
      }
      if (await this.userService.find({ id: authnIdentity.userId })) {
        throw new BadRequestException('User already exists');
      }
    } else {
      const userId = makeUUID();
      authnIdentity = await this.authnService.createIdentity({
        /**
         * Primary auth method has the same key as the user,
         *  secondary methods (not implemented) need to be attached using an existing auth
         */
        id: userId,
        provider: auth.provider,
        providerId: auth.providerId,
        disabled: false,
        type: USER_AUTHN_KEY,
        userId,
      });
    }

    /**
     * Fetch user data from the provider
     * - this procedure can fail, so the code above should be idempotent
     */
    const providerUserData = await this.authnService.providerUserData(auth);

    return await this.userService.create({
      id: authnIdentity.userId,
      email: providerUserData?.email,
      name: providerUserData?.name,
      ...Object.fromEntries(Object.entries(userData).filter(([, v]) => v !== undefined)),
    });
  }
}
