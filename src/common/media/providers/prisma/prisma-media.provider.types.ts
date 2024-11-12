export const PRISMA_MEDIA_PROVIDER_NAME = 'prisma';

export interface IPrismaMediaProviderJWTToken {
  iat: number;
  exp: number;
  aud: 'media:upload' | 'media:fetch';

  key: string;
  fsz?: string;
  mtp?: string;
}
