export class RmqRequestFailedException extends Error {
  constructor() {
    super();
    this.message = 'RMQ request failed.';
  }
}
