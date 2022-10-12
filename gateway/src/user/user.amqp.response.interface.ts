export interface AmqpResponse {
  success: boolean;
  data;
  error: AmqpResponseError;
}

interface AmqpResponseError {
  code: number;
  message: string;
  where: string;
}
