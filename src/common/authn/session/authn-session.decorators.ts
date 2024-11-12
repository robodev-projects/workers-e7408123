import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AuthnException } from '~common/authn';
import { AUTHN_SESSION_PROVIDER_NAME } from '~common/authn/session/authn-session.types';

/**
 * Pull the session payload from the request context
 */
export const SessionPayload = createParamDecorator((data: never, ctx: ExecutionContext): Record<string, any> => {
  const req = ctx.switchToHttp().getRequest();
  if (req.auth?.provider !== AUTHN_SESSION_PROVIDER_NAME || !req.auth.providerData?.session) {
    throw new AuthnException('Session payload not found in request context');
  }
  return req.auth.providerData.session.payload;
});
