export class RmqError {
  code: number;
  message: string;
  where: string;
}

export class RmqResponse<T = object> {
  success: boolean;
  data: T | null;
  error: RmqError | null;
}

export class RmqErrorResponse extends RmqResponse {
  constructor(rmqError: RmqError) {
    super();
    this.success = false;
    this.data = null;
    this.error = rmqError;
  }
}
