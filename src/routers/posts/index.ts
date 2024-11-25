import { Router } from 'express';

import type { SequelizeClient } from '../../sequelize';

import {
  initListUsersPostsRequestHandler,
  initCreatePostRequestHandler,
  initListAllPostsRequestHandler,
  initGetPostRequestHandler,
  initUpdatePostRequestHandler,
  initDeletePostRequestHandler,
  initPublishPostRequestHandler,
} from './handlers';

import {
  validateCreatePost,
  validateUpdatePost,
} from '../../validation/postsValidation';

import { initTokenValidationRequestHandler } from '../../middleware/security';

export function initPostsRouter(sequelizeClient: SequelizeClient): Router {
  const router = Router({ mergeParams: true });

  const tokenValidation = initTokenValidationRequestHandler(sequelizeClient);

  router
    .route('/')
    .get(tokenValidation, initListUsersPostsRequestHandler(sequelizeClient))
    .post(
      tokenValidation,
      validateCreatePost,
      initCreatePostRequestHandler(sequelizeClient),
    );

  router
    .route('/all')
    .get(tokenValidation, initListAllPostsRequestHandler(sequelizeClient));

  router
    .route('/:id')
    .get(tokenValidation, initGetPostRequestHandler(sequelizeClient))
    .put(
      tokenValidation,
      validateUpdatePost,
      initUpdatePostRequestHandler(sequelizeClient),
    )
    .delete(tokenValidation, initDeletePostRequestHandler(sequelizeClient));

  router
    .route('/:id/publish')
    .patch(tokenValidation, initPublishPostRequestHandler(sequelizeClient));

  return router;
}
