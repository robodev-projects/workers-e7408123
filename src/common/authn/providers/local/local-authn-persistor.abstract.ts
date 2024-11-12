import { ILocalAuthnIdentity, ILocalAuthnIdentityCreate, ILocalAuthnIdentityUpdate } from './local-authn.types';

export abstract class LocalAuthnPersistor {
  public abstract findLocalIdentity(where: { id: string } | { email: string }): Promise<ILocalAuthnIdentity | null>;

  public abstract createLocalIdentity(data: ILocalAuthnIdentityCreate): Promise<ILocalAuthnIdentity>;

  public abstract updateLocalIdentity(
    where: { id: string } | { email: string },
    data: ILocalAuthnIdentityUpdate,
  ): Promise<ILocalAuthnIdentity>;

  public abstract deleteLocalIdentity(where: { id?: string | string[] } | { email?: string | string[] }): Promise<void>;
}
