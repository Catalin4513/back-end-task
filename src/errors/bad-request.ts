import { HttpError } from './http';

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(message, 400);
  }
}
