export class RmqError {
  constructor(
    private readonly code: number,
    private readonly message: string,
    private readonly where: string,
  ) {}
}

export class RmqResponse<T = any> {
  success: boolean;
  data: T | null;
  error: RmqError | null;
}
