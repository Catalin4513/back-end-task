import { Router } from 'express';
import type { SequelizeClient } from '../../sequelize';

import {
  initListUserCommentsRequestHandler,
  initListPostCommentsRequestHandler,
  initGetCommentRequestHandler,
  initCreateCommentRequestHandler,
  initUpdateCommentRequestHandler,
  initDeleteCommentRequestHandler,
} from './handlers';

import { initTokenValidationRequestHandler } from '../../middleware/security';
import {
  validateCommentId,
  validateCreateComment,
} from '../../validation/commentsValidation';

export function initCommentsRouter(sequelizeClient: SequelizeClient): Router {
  const router = Router({ mergeParams: true });

  const tokenValidation = initTokenValidationRequestHandler(sequelizeClient);

  router
    .route('/')
    .get(tokenValidation, initListUserCommentsRequestHandler(sequelizeClient));

  router
    .route('/post/:id')
    .get(tokenValidation, initListPostCommentsRequestHandler(sequelizeClient));

  router
    .route('/:id')
    .get(
      tokenValidation,
      validateCommentId,
      initGetCommentRequestHandler(sequelizeClient),
    )
    .post(
      tokenValidation,
      validateCreateComment,
      initCreateCommentRequestHandler(sequelizeClient),
    )
    .put(
      tokenValidation,
      validateCommentId,
      initUpdateCommentRequestHandler(sequelizeClient),
    )
    .delete(
      tokenValidation,
      validateCommentId,
      initDeleteCommentRequestHandler(sequelizeClient),
    );

  return router;
}
