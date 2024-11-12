import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { Allow } from 'class-validator';
import * as jwt from 'jsonwebtoken';
import { IsFile, MemoryStoredFile, isFile } from 'nestjs-form-data';

import { getConfig } from '~common/config';
import { ValidateInline } from '~common/validate';

import { PrismaMediaProviderConfig } from '../prisma-media.provider.config';
import { IPrismaMediaProviderJWTToken } from '../prisma-media.provider.types';

const prismaMediaProviderConfig = getConfig(PrismaMediaProviderConfig);

export class PrismaMediaProviderUploadDto {
  @ApiProperty({ type: 'string' })
  @Expose()
  @Transform(
    async ({ value }) => await jwt.verify(value, prismaMediaProviderConfig.secret, { audience: 'media:upload' }),
  )
  @Allow()
  token!: Promise<IPrismaMediaProviderJWTToken>;

  @Expose()
  @ValidateInline(
    async ({ object, value }) => {
      return (await object.token).fsz === value;
    },
    { message: 'Invalid file size' },
  )
  fileSize!: string;

  @Expose()
  @ValidateInline(
    async ({ object, value }) => {
      return (await object.token).mtp === value;
    },
    { message: 'Invalid mime type' },
  )
  mimeType!: string;

  @Expose()
  @ValidateInline(
    async ({ object, value }) => {
      return (await object.token).key === value;
    },
    { message: 'Invalid key' },
  )
  key!: string;

  @Expose()
  @IsFile()
  @ValidateInline(
    async ({ object, value }) => {
      if (!isFile(value)) return false;
      const { fsz, mtp } = await object.token;
      // validate size and mime type to match the token
      return !(value.size.toString() !== fsz || value.mimeTypeWithSource.value !== mtp);
    },
    { message: 'File does not match request' },
  )
  file!: MemoryStoredFile;
}
