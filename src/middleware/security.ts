import { RequestHandler, Request } from 'express';

import type { SequelizeClient } from '../sequelize';
import type { User } from '../repositories/types';

import { UnauthorizedError, ForbiddenError } from '../errors';
import { isValidToken, extraDataFromToken } from '../security';
import { UserType } from '../constants';

export function initTokenValidationRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function tokenValidationRequestHandler(req, res, next): void {
    (async (): Promise<void> => {
      try {
        const { models } = sequelizeClient;

        const authorizationHeaderValue = req.header('authorization');
        if (!authorizationHeaderValue) {
          throw new UnauthorizedError('AUTH_MISSING');
        }

        const [type, token] = authorizationHeaderValue.split(' ');
        if (type?.toLowerCase() !== 'bearer') {
          throw new UnauthorizedError('AUTH_WRONG_TYPE');
        }

        if (!token) {
          throw new UnauthorizedError('AUTH_TOKEN_MISSING');
        }

        if (!isValidToken(token)) {
          throw new UnauthorizedError('AUTH_TOKEN_INVALID');
        }

        const { id } = extraDataFromToken(token);

        const user = await models.users.findByPk(id);
        if (!user) {
          throw new UnauthorizedError('AUTH_TOKEN_INVALID');
        }

        (req as AuthenticatedRequest).auth = {
          token,
          user,
        } as RequestAuth;

        next();
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

// NOTE(roman): assuming that `tokenValidationRequestHandler` is placed before
interface AuthenticatedRequest extends Request {
  auth?: RequestAuth;
}

export function initAdminValidationRequestHandler(): RequestHandler {
  return function adminValidationRequestHandler(
    req: AuthenticatedRequest,
    res,
    next,
  ): void {
    try {
      const auth = req.auth;

      if (!auth || auth.user.type !== UserType.ADMIN) {
        throw new ForbiddenError('ADMIN_PRIVILEGES_REQUIRED');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export interface RequestAuth {
  token: string;
  user: User;
}
