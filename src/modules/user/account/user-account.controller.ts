import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';

import {
  IAuthnIdentity,
  AuthnIdentity,
  AuthnProviderIdentity,
  IAuthnProviderIdentity,
  AuthenticatedProvider,
} from '~common/authn';
import { NotFoundException } from '~common/exceptions/not-found.exception';
import { MediaService, MediaUploadInstructionsDto, MediaUploadRequestDto } from '~common/media';

import { AuthenticatedUser } from '../user.decorators';
import { UserAccountCreateDto } from './dtos/user-account.create.dto';
import { UserAccountDto } from './dtos/user-account.dto';
import { UserAccountUpdateDto } from './dtos/user-account.update.dto';
import { UserAccountService } from './user-account.service';

@ApiTags('Account')
@Controller('account')
export class UserAccountController {
  constructor(
    private readonly accountService: UserAccountService,
    private readonly mediaService: MediaService,
  ) {}

  /**
   * Get the requesting user
   */
  @Get()
  @AuthenticatedUser()
  @ApiExcludeEndpoint()
  async get(@AuthnIdentity() auth: IAuthnIdentity): Promise<UserAccountDto> {
    let userMe = await this.accountService.find({ id: auth.userId });
    if (!userMe) {
      throw new NotFoundException('User not found');
    }
    userMe = await this.accountService.resolveMedia(userMe);
    return UserAccountDto.fromDomain(userMe);
  }

  /**
   * Update the requesting user
   */
  @Put()
  @AuthenticatedUser()
  async update(@AuthnIdentity() auth: IAuthnIdentity, @Body() body: UserAccountUpdateDto): Promise<UserAccountDto> {
    let updatedMe = await this.accountService.update({ id: auth.userId }, body);
    updatedMe = await this.accountService.resolveMedia(updatedMe);
    return UserAccountDto.fromDomain(updatedMe);
  }

  /**
   * Create a new media and return upload instructions
   */
  @Post('upload-request')
  @AuthenticatedUser()
  async create(@Body() dto: MediaUploadRequestDto, @AuthnIdentity() identity: IAuthnIdentity) {
    const uploadRequest = MediaUploadRequestDto.toDomain(dto);

    // uploadRequest.resourceName is not needed here

    const instructions = await this.mediaService.createMediaUploadRequest(
      { ...uploadRequest, userId: identity.userId, resourceName: `${identity.userId}/profile-picture` },
      {
        constraints: {
          mimeTypes: ['image/jpeg', 'image/png', 'image/jpeg'],
          fileSize: 1024 * 1024 * 2, // 2mb
        },
        method: dto.method || 'put',
      },
    );
    return MediaUploadInstructionsDto.fromDomain(instructions);
  }

  /**
   * Register a new user
   */
  @Post('register')
  @AuthenticatedProvider()
  async register(
    @AuthnProviderIdentity() auth: IAuthnProviderIdentity,
    @Body() data: UserAccountCreateDto,
  ): Promise<UserAccountDto> {
    const created = await this.accountService.create(auth, data);
    return UserAccountDto.fromDomain(created);
  }
}
