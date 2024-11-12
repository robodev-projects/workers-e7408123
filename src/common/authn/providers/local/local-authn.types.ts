export const LOCAL_AUTHN_PROVIDER_NAME = 'local';

export interface ILocalAuthnIdentity {
  id: string;

  email: string;
  password?: string;

  magicLinkCode?: string;
  magicLinkCodeExpiresAt?: Date;

  disabled: boolean;
  validated: boolean;

  createdAt: Date;
}

export interface ILocalAuthnIdentityCreate {
  id?: string;
  email: string;
  password?: string;

  magicLinkCode?: string;
  magicLinkCodeExpiresAt?: Date;

  disabled?: boolean;
  validated?: boolean;
}

export interface ILocalAuthnIdentityUpdate {
  email?: string;
  password?: string;

  magicLinkCode?: string;
  magicLinkCodeExpiresAt?: Date;

  disabled?: boolean;
  validated?: boolean;
}

export interface ILocalAuthnPasswordRegistrationRequest {
  email: string;
  password: string;
}

export interface ILocalAuthnPasswordChangeRequest {
  password: string;
}

export interface ILocalAuthnPasswordLoginRequest {
  email: string;
  password: string;
}

export interface ILocalAuthnMagicLinkRequest {
  email: string;
}
