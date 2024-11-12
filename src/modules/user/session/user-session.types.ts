import { UserRole } from '~modules/user';

export interface IUserSessionPayload {
  roles: Array<UserRole | string>;
}
