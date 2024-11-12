import { Injectable, type ModuleMetadata } from '@nestjs/common';

import { AuthnIdentityPersistor } from '../authn-identity-persistor.abstract';
import type { IAuthnIdentity } from '../authn.types';

@Injectable()
export class NotImplementedAuthnPersistor implements AuthnIdentityPersistor {
  public async findIdentity(): Promise<IAuthnIdentity | null> {
    throw new Error('Not implemented');
  }

  public async createIdentity(): Promise<IAuthnIdentity> {
    throw new Error('Not implemented');
  }

  public async updateIdentity(): Promise<IAuthnIdentity> {
    throw new Error('Not implemented');
  }

  public async deleteIdentity(): Promise<void> {
    throw new Error('Not implemented');
  }
}

export const NotImplementedAuthnPersistorPlugin: ModuleMetadata = {
  providers: [{ provide: AuthnIdentityPersistor, useClass: NotImplementedAuthnPersistor }],
  exports: [AuthnIdentityPersistor],
};
