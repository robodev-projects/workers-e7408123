import { Injectable, type ModuleMetadata } from '@nestjs/common';

import { LocalAuthnPersistor } from '../local-authn-persistor.abstract';
import { ILocalAuthnIdentity } from '../local-authn.types';

@Injectable()
export class NotImplementedLocalAuthnPersistor implements LocalAuthnPersistor {
  public async findLocalIdentity(): Promise<ILocalAuthnIdentity | null> {
    throw new Error('Not implemented');
  }

  public async createLocalIdentity(): Promise<ILocalAuthnIdentity> {
    throw new Error('Not implemented');
  }

  public async updateLocalIdentity(): Promise<ILocalAuthnIdentity> {
    throw new Error('Not implemented');
  }

  public async deleteLocalIdentity(): Promise<void> {
    throw new Error('Not implemented');
  }
}

export const NotImplementedLocalAuthnPersistorPlugin: ModuleMetadata = {
  providers: [{ provide: LocalAuthnPersistor, useClass: NotImplementedLocalAuthnPersistor }],
};
