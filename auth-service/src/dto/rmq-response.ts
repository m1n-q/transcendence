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
