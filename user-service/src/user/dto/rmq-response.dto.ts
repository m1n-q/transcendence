export class RmqError {
  constructor(
    private readonly code: number,
    private readonly message: string | string[],
    private readonly where: string,
  ) {}
}

export class RmqResponse<T = any> {
  data: T | null;
  error: RmqError | null;

  constructor(payload: any, readonly success: boolean = true) {
    success ? (this.data = payload) : (this.error = payload);
  }
}
