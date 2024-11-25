import { RequestHandler } from 'express';
import { Op } from 'sequelize';

import type { SequelizeClient } from '../../sequelize';
import type { User } from '../../repositories/types';

import { BadRequestError, UnauthorizedError } from '../../errors';
import {
  hashPassword,
  validatePassword,
  generateHashPassword,
  generateToken,
  refreshAccessToken,
} from '../../security';
import { RequestAuth } from '../../middleware/security';
import { UserType } from '../../constants';

export function initListUsersRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function listUsersRequestHandler(req, res, next): void {
    (async (): Promise<void> => {
      const { models } = sequelizeClient;

      try {
        const {
          auth: {
            user: { type: userType },
          },
        } = req as unknown as { auth: RequestAuth };

        const isAdmin = userType === UserType.ADMIN;

        const users = await models.users.findAll({
          attributes: isAdmin ? ['id', 'name', 'email'] : ['name', 'email'],
          ...(!isAdmin && { where: { type: { [Op.ne]: UserType.ADMIN } } }),
          raw: true,
        });

        res.send(users);

        res.end();
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

export function initCreateUserRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function createUserRequestHandler(req, res, next): void {
    (async (): Promise<void> => {
      try {
        // NOTE(roman): missing validation and cleaning
        const { type, name, email, password } = req.body as CreateUserData;

        await createUser({ type, name, email, password }, sequelizeClient);

        res.status(204).end();
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

export function initLoginUserRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function loginUserRequestHandler(req, res, next): void {
    (async (): Promise<void> => {
      try {
        const { models } = sequelizeClient;
        const { name, email, password } = req.body as {
          name?: string;
          email?: string;
          password: string;
        };

        // Construct the where clause dynamically
        const whereClause: { email?: string; name?: string } = {};
        if (email) whereClause.email = email;
        if (name) whereClause.name = name;

        // Ensure the where clause is valid
        if (Object.keys(whereClause).length === 0) {
          throw new UnauthorizedError('EMAIL_OR_NAME_REQUIRED');
        }

        const user = (await models.users.findOne({
          attributes: ['id', 'passwordHash'],
          where: {
            [Op.or]: whereClause,
          },
          raw: true,
        })) as Pick<User, 'id' | 'passwordHash'> | null;

        if (!user) {
          throw new UnauthorizedError('EMAIL_OR_PASSWORD_INCORRECT');
        }

        if (!(await validatePassword(password, user.passwordHash))) {
          throw new UnauthorizedError('EMAIL_OR_PASSWORD_INCORRECT');
        }

        const token = generateToken({ id: user.id });
        const refreshToken = generateToken({ id: user.id });

        res.cookie('jwt', refreshToken, {
          httpOnly: true,
          sameSite: 'none',
          secure: true,
          maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        res.send({ token }).end();
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

export function initRegisterUserRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function createUserRequestHandler(req, res, next): void {
    (async (): Promise<void> => {
      try {
        // Validate input
        const { name, email, password } = req.body as Omit<
          CreateUserData,
          'type'
        >;
        if (!name || !email || !password) {
          res
            .status(400)
            .json({ error: 'Name, email, and password are required.' });
          return;
        }

        await checkIfUserExists(name, email, sequelizeClient);

        // Hash the password
        const hashedPassword = await generateHashPassword(password);

        // Create the user
        await createUser(
          { type: UserType.BLOGGER, name, email, password: hashedPassword },
          sequelizeClient,
        );

        res.status(201).json({ message: 'User successfully created.' }).end();
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

export function initRefreshAccessToken(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function refreshAccessTokenRequestHandler(req, res, next): void {
    (async (): Promise<void> => {
      try {
        const { models } = sequelizeClient;
        const { id } = req.params;
        const token = (req.cookies as { jwt?: string }).jwt;

        const data = await models.users.findByPk(id);

        if (!data) {
          throw new UnauthorizedError('User not found');
        }
        if (!token) {
          throw new UnauthorizedError('Token not found');
        }
        return refreshAccessToken(data, token, res);
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

export async function createUser(
  data: CreateUserData,
  sequelizeClient: SequelizeClient,
): Promise<void> {
  const { type, name, email, password } = data;

  const { models } = sequelizeClient;

  const similarUser = (await models.users.findOne({
    attributes: ['id', 'name', 'email'],
    where: {
      [Op.or]: [{ name }, { email }],
    },
    raw: true,
  })) as Pick<User, 'id' | 'name' | 'email'> | null;
  if (similarUser) {
    if (similarUser.name === name) {
      throw new BadRequestError('NAME_ALREADY_USED');
    }
    if (similarUser.email === email) {
      throw new BadRequestError('EMAIL_ALREADY_USED');
    }
  }

  await models.users.create({ type, name, email, passwordHash: password });
}

export async function getUserNamesByIds(
  userIds: number[],
  models: SequelizeClient['models'],
): Promise<Record<number, string>> {
  const authors = await models.users.findAll({
    attributes: ['id', 'name'],
    where: { id: userIds },
    raw: true,
  });

  return authors.reduce(
    (map, author) => {
      map[author.id] = author.name;
      return map;
    },
    {} as Record<number, string>,
  );
}

export function initDeleteUserRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return (req, res, next): void => {
    (async (): Promise<void> => {
      try {
        const { id } = req.params;
        const user = await sequelizeClient.models.users.findByPk(id);

        if (!user) {
          throw new BadRequestError('User not found');
        }

        if (user.type !== UserType.BLOGGER) {
          throw new BadRequestError('Cannot delete user of this type');
        }

        await user.destroy();
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

export function initCreateAdminRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return (req, res, next) => {
    (async (): Promise<void> => {
      try {
        const { name, email, password } = req.body as {
          name: string;
          email: string;
          password: string;
        };

        await checkIfUserExists(name, email, sequelizeClient);

        const hashedPassword = await hashPassword(password);
        if (!hashedPassword) {
          throw new BadRequestError('Password hashing failed');
        }

        await sequelizeClient.models.users.create({
          name,
          email,
          passwordHash: hashedPassword,
          type: UserType.ADMIN,
        });

        res.status(201).json({ message: 'Admin successfully created.' }).end();
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

async function checkIfUserExists(
  name: string,
  email: string,
  sequelizeClient: SequelizeClient,
): Promise<void> {
  const { models } = sequelizeClient;

  const existingUser = await models.users.findOne({
    attributes: ['id', 'name', 'email'],
    where: {
      [Op.or]: [{ name }, { email }],
    },
    raw: true,
  });

  if (existingUser) {
    if (existingUser.name === name) {
      throw new BadRequestError('NAME_ALREADY_USED');
    }
    if (existingUser.email === email) {
      throw new BadRequestError('EMAIL_ALREADY_USED');
    }
  }
}

type CreateUserData = Pick<User, 'type' | 'name' | 'email'> & {
  password: User['passwordHash'];
};
