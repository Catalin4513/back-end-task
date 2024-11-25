import type { ErrorRequestHandler } from 'express';

import { HttpError } from '../errors';

export function initErrorRequestHandler(): ErrorRequestHandler {
  return function errorRequestHandler(error, req, res, next) {
    // NOTE(roman): https://expressjs.com/en/guide/error-handling.html
    if (res.headersSent) {
      return next(error);
    }

    const httpError = error instanceof HttpError ? error : convertError(error);

    const { name, message, stack, httpCode } = httpError;

    return res.status(httpCode).send({ name, message, stack }).end();
  };
}

function convertError(error: unknown): HttpError {
  return error instanceof Error
    ? HttpError.fromError(error)
    : new HttpError(JSON.stringify(error));
}
