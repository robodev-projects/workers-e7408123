import { type ModuleMetadata } from '@nestjs/common';

import { HotwireAuthnProvider } from './hotwire-authn.provider';

/**
 * Hotwire authentication module
 *  Bypasses authentication, allowing the requester to define their own user/auth data
 *  DO NOT USE IN PRODUCTION
 *  @example Authentication Header: `Bearer {"userId": "7b8775ae-e687-491a-8e6b-eb6707f4ef43","type":"user"}`
 */
export const HotwireAuthnPlugin: ModuleMetadata = {
  providers: [HotwireAuthnProvider],
  exports: [HotwireAuthnProvider],
};
