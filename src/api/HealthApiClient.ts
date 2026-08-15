import { ApiClient } from './ApiClient';
import type { ApiResult } from './types';

export class HealthApiClient extends ApiClient {
  check(): Promise<ApiResult<undefined>> {
    return this.send('GET', 'health-check');
  }
}
