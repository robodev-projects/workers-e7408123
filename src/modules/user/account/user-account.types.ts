import { MediaAttachRequestDto, MediaFetchInstructionsDto } from '~common/media';

export interface IUserAccount {
  name?: string;
  email?: string;
  profilePicture?: MediaFetchInstructionsDto;
}

export interface IUserAccountCreate {
  name?: string;
  email?: string;
}

export interface IUserAccountUpdate {
  name?: string;
  email?: string;
  profilePicture?: MediaAttachRequestDto;
}
