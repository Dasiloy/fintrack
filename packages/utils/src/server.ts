import { type StandardResponse } from '@fintrack/types/interfaces/server_response';

export class ServerFormatter {
  static formatSuccess(response: any) {
    return (
      response.data?.data?.message ?? response.data?.message ?? response.message ?? 'Successful!'
    );
  }

  static formatError(err: any) {
    return err.response?.data?.message ?? err.message ?? 'Unknown Error';
  }
}
