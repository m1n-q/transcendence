import { RmqError } from './rmq-error';

export class RmqResponse<T = object> {
  data: T | null;
  error: RmqError | null;

  constructor(payload: any, readonly success: boolean = true) {
    this.data = this.error = null;
    success ? (this.data = payload) : (this.error = payload);
  }
}
