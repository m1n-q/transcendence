export interface AmqpResponse {
  success: string;
  data;
  error: AmqpResponseError;
}

interface AmqpResponseError {
  code: number;
  message: string;
  where: string;
}
