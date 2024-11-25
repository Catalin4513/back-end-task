import { HttpError } from './http';

export class NotImplementedError extends HttpError {
  constructor(message: string) {
    super(message, 500);
  }
}
