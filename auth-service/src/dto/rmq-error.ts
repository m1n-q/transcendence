import { HttpException } from '@nestjs/common';
import { rm } from 'fs';

export class RmqError {
  constructor(
    private readonly code: number,
    private readonly message: string | string[],
    private readonly where: string,
  ) {}

  getCode(): number {
    return this.code;
  }
  getMessage(): string | string[] {
    return this.message;
  }
  getWhere(): string {
    return this.where;
  }
}

export class HttpExceptionAdapter extends HttpException {
  constructor(private readonly rmqError: RmqError) {
    super(rmqError, rmqError.getCode());
  }
}
