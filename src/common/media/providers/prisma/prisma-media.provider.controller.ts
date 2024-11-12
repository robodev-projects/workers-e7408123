import { Body, Controller, Get, Param, Post, Query, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';

import { PrismaMediaProviderUploadDto } from './dtos/prisma-media-provider-upload.dto';
import { PrismaMediaProvider } from './prisma-media.provider';

@ApiTags('Media')
@Controller('media/provider/prisma')
export class PrismaMediaProviderController {
  constructor(private readonly prismaMediaProvider: PrismaMediaProvider) {}

  @Post('upload')
  @FormDataRequest()
  async upload(@Body() { token, file }: PrismaMediaProviderUploadDto): Promise<void> {
    await this.prismaMediaProvider.validateAndUpload(await token, file.buffer);
  }

  @Get('fetch/:key([^/]+/[^/]+)')
  async fetch(@Param('key') key: string, @Query('token') token: string): Promise<StreamableFile> {
    const media = await this.prismaMediaProvider.validateAndFetch(token);
    return new StreamableFile(media.blob!, {
      type: media.mimeType,
      length: media.fileSize,
      disposition: `attachment; filename="${media.fileName}"`,
    });
  }
}
