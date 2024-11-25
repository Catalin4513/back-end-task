import { Router } from 'express';
import type { SequelizeClient } from '../../sequelize';

import {
  initListUsersRequestHandler,
  initCreateUserRequestHandler,
  initLoginUserRequestHandler,
  initRegisterUserRequestHandler,
  initCreateAdminRequestHandler,
  initDeleteUserRequestHandler,
  initRefreshAccessToken,
} from './handlers';

import {
  initTokenValidationRequestHandler,
  initAdminValidationRequestHandler,
} from '../../middleware/security';

import {
  validateLogin,
  validateRegister,
  validateRefreshToken,
  validateAdminAction,
} from '../../validation/userValidation';
export function initUsersRouter(sequelizeClient: SequelizeClient): Router {
  const router = Router({ mergeParams: true });

  const tokenValidation = initTokenValidationRequestHandler(sequelizeClient);
  const adminValidation = initAdminValidationRequestHandler();

  router
    .route('/')
    .get(tokenValidation, initListUsersRequestHandler(sequelizeClient))
    .post(
      tokenValidation,
      adminValidation,
      initCreateUserRequestHandler(sequelizeClient),
    );

  router
    .route('/login')
    .post(validateLogin, initLoginUserRequestHandler(sequelizeClient));

  router
    .route('/register')
    .post(validateRegister, initRegisterUserRequestHandler(sequelizeClient));

  router
    .route('/refresh/:id')
    .post(validateRefreshToken, initRefreshAccessToken(sequelizeClient));

  router
    .route('/admins')
    .post(
      tokenValidation,
      adminValidation,
      initCreateAdminRequestHandler(sequelizeClient),
    );

  router
    .route('/admins/:id')
    .delete(
      tokenValidation,
      adminValidation,
      validateAdminAction,
      initDeleteUserRequestHandler(sequelizeClient),
    );

  return router;
}
