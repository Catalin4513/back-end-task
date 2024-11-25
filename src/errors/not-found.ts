import { HttpError } from './http';

export class NotFoundError extends HttpError {
  path: string;

  constructor(message: string, method: string, path: string) {
    super(message, 404);

    this.path = path;
  }
}
