import { ModuleMetadata } from '@nestjs/common';

import { EmailModule } from '~common/email';

import { LocalAuthnMagicLinkController } from './local-authn-magic-link.controller';
import { LocalAuthnMagicLinkService } from './local-authn-magic-link.service';

export const LocalAuthnMagicLinkPlugin: ModuleMetadata = {
  imports: [EmailModule.forRoot()],
  providers: [LocalAuthnMagicLinkService],
  controllers: [LocalAuthnMagicLinkController],
};
