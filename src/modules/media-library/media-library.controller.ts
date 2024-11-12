import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Authenticated, AuthnIdentity, IAuthnIdentity } from '~common/authn';
import { BadRequestException } from '~common/exceptions';
import { MediaService, MediaUploadRequestDto } from '~common/media';
import { MediaUploadInstructionsDto } from '~common/media';

import { MediaLibrary } from './media-library.constants';

@ApiTags('Media')
@Controller('media/library')
export class MediaLibraryController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Request upload instructions for a new media file
   */
  @Post('upload-request')
  @Authenticated()
  async uploadRequest(@Body() dto: MediaUploadRequestDto, @AuthnIdentity() identity: IAuthnIdentity) {
    const uploadRequest = MediaUploadRequestDto.toDomain(dto);

    if (!uploadRequest.resourceName) {
      throw new BadRequestException('Missing ResourceName');
    }

    const constraints = Object.values(MediaLibrary).find((x) => x.name === uploadRequest.resourceName);

    if (!constraints) {
      throw new BadRequestException('Invalid ResourceName');
    }

    const instructions = await this.mediaService.createMediaUploadRequest(
      { ...uploadRequest, userId: identity.userId, resourceName: uploadRequest.resourceName },
      { constraints, method: dto.method },
    );
    return MediaUploadInstructionsDto.fromDomain(instructions);
  }

  /**
   * Validate a media
   */
  //@Post('validate/:mediaId')
  //@Authenticated()
  //async validate(@Param('mediaId') mediaId: string) {
  //  await this.mediaService.validate(mediaId);
  //}
}
