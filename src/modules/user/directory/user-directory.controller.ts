import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ApiPaginatedListResponse, PaginatedListDto } from '~common/http/pagination';

import { UserDto } from '../dtos/user.dto';
import { UserListQueryDto } from '../dtos/user.query.dto';
import { AuthenticatedUser } from '../user.decorators';
import { UserService } from '../user.service';

@ApiTags('User')
@Controller('users')
@AuthenticatedUser()
export class UserDirectoryController {
  constructor(private readonly userService: UserService) {}

  /**
   * List users
   */
  @Get()
  @ApiPaginatedListResponse(UserDto)
  async list(@Query() query: UserListQueryDto): Promise<PaginatedListDto<UserDto>> {
    const users = await this.userService.paginate(query);
    users.items = await this.userService.resolveMedia(users.items);
    return PaginatedListDto.fromDomain(users, UserDto.fromDomain);
  }
}
