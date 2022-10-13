export class RmqRequestFailedException extends Error {
  constructor(consumer: string) {
    super();
    this.message = `RMQ request to ${consumer} failed.`;
  }
}
