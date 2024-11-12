import { applyDecorators, CanActivate, ExecutionContext, Injectable, mixin, UseGuards } from '@nestjs/common';

import { AuthenticatedDecoratorsFactory, AuthnService } from '~common/authn';
import { AUTHN_SESSION_PROVIDER_NAME } from '~common/authn/session/authn-session.types';

import { UserService } from '~modules/user/user.service';

import { USER_AUTHN_KEY, UserRole } from './user.constants';

/**
 * Convert the request context auth to an authenticated user and check for USER auth
 */
export function AuthenticatedUser() {
  return applyDecorators(...AuthenticatedDecoratorsFactory({ userType: USER_AUTHN_KEY }));
}

/**
 * Convert the request context auth to an authenticated user
 *  - validate authentication
 *  - validate roles from jwt/session/userobject
 */
export function AuthorizedUser(options?: {
  roles?: UserRole | UserRole[] | string | string[];
  provider?: string | string[];
}) {
  return applyDecorators(
    ...AuthenticatedDecoratorsFactory({ userType: USER_AUTHN_KEY, provider: options?.provider }),
    ...(options?.roles ? [UseGuards(UserRoleGuard({ roles: options.roles }))] : []),
  );
}

/**
 * Protect a route with a user role
 */
export const UserRoleGuard = (options?: { roles: UserRole | UserRole[] | string | string[] }) => {
  @Injectable()
  class UserRoleGuardMixin implements CanActivate {
    constructor(
      public readonly authnService: AuthnService,
      public readonly userService: UserService,
    ) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
      // get auth stored in the request context

      let allowedRoles: UserRole[] = [];
      {
        const { auth } = context.switchToHttp().getRequest();

        if (!auth) {
          return false;
        }

        if (auth.provider === AUTHN_SESSION_PROVIDER_NAME && auth?.providerData?.session?.payload?.roles) {
          // check session roles
          allowedRoles = auth?.providerData?.session?.payload?.roles;
        } else if (auth.userId && auth.type === USER_AUTHN_KEY) {
          // check database roles
          const user = await this.userService.find({ id: auth.userId });
          if (user?.roles) {
            allowedRoles = user.roles;
          }
        }
      }

      if (allowedRoles.length > 0) {
        const roles = Array.isArray(options?.roles) ? options.roles : [options?.roles];
        if (roles && allowedRoles.some((role) => roles.includes(role))) {
          return true;
        }
      }

      return false;
    }
  }
  return mixin(UserRoleGuardMixin);
};
