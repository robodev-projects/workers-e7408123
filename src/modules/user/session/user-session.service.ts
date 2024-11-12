import { Injectable } from '@nestjs/common';

import { AuthnSessionProvider, IAuthnIdentity } from '~common/authn';
import { BadRequestException, InternalServerErrorException } from '~common/exceptions';

import { IUserSessionPayload } from '~modules/user/session/user-session.types';

import { USER_AUTHN_KEY } from '../user.constants';
import { UserService } from '../user.service';

@Injectable()
export class UserSessionService {
  constructor(
    private readonly authnSessionProvider: AuthnSessionProvider,
    private readonly userService: UserService,
  ) {}

  async login(auth: IAuthnIdentity) {
    if (auth.provider === 'session') {
      throw new BadRequestException('Already logged in');
    }

    const user = await this.userService.find({ id: auth.userId });

    if (!user) {
      throw new InternalServerErrorException('User not found');
    }

    const { refreshToken, session } = await this.authnSessionProvider.createSession(
      {
        userId: auth.userId,
        authnId: auth.id,
        userType: USER_AUTHN_KEY,
      },
      {
        roles: user.roles,
      } satisfies IUserSessionPayload,
    );

    const { accessToken } = await this.authnSessionProvider.createAccessToken({
      userId: session.userId,
      sessionId: session.sessionId,
    });

    return { refreshToken, accessToken };
  }

  async accessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { session, shouldExtend } = await this.authnSessionProvider.resolveSession(refreshToken, 'session:refresh');

    let newRefreshToken: string | undefined;
    if (shouldExtend) {
      const newSession = await this.authnSessionProvider.updateSession(session);
      newRefreshToken = newSession.refreshToken;
    }

    const user = await this.userService.find({ id: session.userId });

    if (!user) {
      throw new InternalServerErrorException('User not found');
    }

    const { accessToken } = await this.authnSessionProvider.createAccessToken(
      {
        userId: session.userId,
        sessionId: session.sessionId,
      },
      {
        roles: user.roles,
      } satisfies IUserSessionPayload,
    );

    return { accessToken, refreshToken: newRefreshToken || refreshToken };
  }

  async list(userId: string) {
    return await this.authnSessionProvider.listSessions(userId);
  }

  async logout(userId: string, sessionId?: string): Promise<boolean> {
    if (!sessionId) {
      // delete all sessions
      await this.authnSessionProvider.deleteSessions(userId);
      return true;
    } else {
      return await this.authnSessionProvider.deleteSession(sessionId, userId);
    }
  }
}
