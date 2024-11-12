import {
  Injectable,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  UseGuards,
  applyDecorators,
  NestMiddleware,
  mixin,
  Type,
} from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { NextFunction } from 'express';

import type { IAuthnIdentity, IAuthnProviderIdentity } from '~common/authn/authn.types';

import { AuthnException } from './authn.exceptions';
import { AuthnService } from './authn.service';

/**
 * Resolve Headers and apply an auth object to the request
 *  applied globally but can also be applied per route
 */
export function AuthnMiddleware(options?: { provider?: string | string[] }): Type<NestMiddleware> {
  @Injectable()
  class AuthnMiddlewareMixin implements NestMiddleware {
    constructor(private readonly authService: AuthnService) {}
    public async use(req: Request, res: Response, next: NextFunction): Promise<void> {
      await this.authService.applyAuthnProviderIdentity(
        {
          switchToHttp: () => ({
            getRequest: () => req,
          }),
        } as any,
        options,
      );
      next();
    }
  }

  return mixin(AuthnMiddlewareMixin);
}

/**
 * Allow any authenticated client in the route
 */
export const AuthnGuard = (options?: { userType?: string; provider?: string | string[] }) => {
  @Injectable()
  class AuthnGuardMixin implements CanActivate {
    constructor(public readonly authnService: AuthnService) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
      // usually, decorators should not have side effects
      //  there should be a better way to provide the authnIdentity
      const auth = await this.authnService.applyAuthnIdentity(context);

      if (!auth || !auth.id || !auth.userId) {
        return false;
      }

      if (options?.provider) {
        if (Array.isArray(options.provider)) {
          if (!options.provider.includes(auth.provider)) {
            return false;
          }
        } else if (auth.provider !== options.provider) {
          return false;
        }
      }

      if (options?.userType && auth?.type !== options?.userType) {
        return false;
      }

      if (auth.disabled) {
        return false;
      }

      return true;
    }
  }
  return mixin(AuthnGuardMixin);
};

/**
 * Allow a specific provider to access the route
 */
export const AuthnProviderGuard = (options?: { provider?: string | string[] }) => {
  @Injectable()
  class AuthnGuardMixin implements CanActivate {
    constructor(public readonly authnService: AuthnService) {}
    async canActivate(ctx: ExecutionContext): Promise<boolean> {
      const req = ctx.switchToHttp().getRequest();
      if (!req.auth?.provider || !req.auth.providerId) {
        return false;
      }
      if (options?.provider) {
        if (Array.isArray(options.provider)) {
          if (!options.provider.includes(req.auth.provider)) {
            return false;
          }
        } else if (req.auth.provider !== options.provider) {
          return false;
        }
      }
      return true;
    }
  }
  return mixin(AuthnGuardMixin);
};

export function AuthenticatedDecoratorsFactory(options?: { userType?: string; provider?: string | string[] }) {
  return [
    ApiBearerAuth('Authorization'),
    UseGuards(AuthnGuard(options)),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  ];
}

/**
 * Convert the request context auth to an authenticated user and check for any auth
 */
export function Authenticated(options?: { userType?: string; provider?: string | string[] }) {
  return applyDecorators(...AuthenticatedDecoratorsFactory(options));
}

/**
 * Check for a specific provider in the request context
 */
export function AuthenticatedProvider(options?: { provider?: string | string[] }) {
  return applyDecorators(
    ApiBearerAuth('Authorization'),
    UseGuards(AuthnProviderGuard(options)),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}

/**
 * Pull the AuthnIdentity from the request context
 */
export const AuthnIdentity = createParamDecorator(
  (userType: string | undefined, ctx: ExecutionContext): IAuthnIdentity => {
    const req = ctx.switchToHttp().getRequest();
    if (!req.auth || !req.auth.userId) {
      throw new AuthnException('Identity not found in request context');
    }
    if (userType && req.auth.type !== userType) {
      throw new AuthnException(`Identity type mismatch`);
    }
    return req.auth as IAuthnIdentity;
  },
);

/**
 * Pull the AuthnProviderIdentity from the request context
 */
export const AuthnProviderIdentity = createParamDecorator(
  (data: never, ctx: ExecutionContext): IAuthnProviderIdentity => {
    const req = ctx.switchToHttp().getRequest();
    if (!req.auth?.provider || !req.auth.providerId) {
      throw new AuthnException('Provider Identity not found in request context');
    }
    return req.auth as IAuthnProviderIdentity;
  },
);
