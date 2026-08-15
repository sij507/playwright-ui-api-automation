import type { APIRequestContext } from '@playwright/test';
import { runAction } from '../utils/step';
import { sanitizeHeaders, sanitizeObject } from '../utils/sanitize';
import type { ApiEnvelope, ApiResult } from './types';

/**
 * Thin wrapper around Playwright's APIRequestContext shared by every API
 * client (UsersApiClient, NotesApiClient): every call is logged and
 * reported as its own action-level step (e.g. "POST /notes"), matching how
 * BasePage.perform() reports UI actions — so API tests get the same
 * step-by-step report rows without each client hand-rolling test.step().
 *
 * The call itself, its request headers, its request body, and its response
 * status are each logged as their own nested action rows — sanitized
 * first, so a `password`/`x-auth-token`/`Authorization`/etc. value never
 * reaches the console or the report in the clear.
 */
export class ApiClient {
  constructor(protected readonly request: APIRequestContext) {}

  protected async send<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    options: { form?: Record<string, string | boolean>; headers?: Record<string, string> } = {},
  ): Promise<ApiResult<T>> {
    // Logged with a leading slash for readability (e.g. "GET /notes") even
    // though `path` itself must stay slash-less for the actual fetch — see
    // src/data/env.ts for why a leading "/" would silently drop "/notes/api"
    // from the resolved URL.
    return runAction(`${method} /${path}`, async () => {
      if (options.headers && Object.keys(options.headers).length) {
        const sanitizedHeaders = sanitizeHeaders(options.headers);
        await runAction(`Request headers: ${JSON.stringify(sanitizedHeaders)}`, async () => {});
      }

      if (options.form && Object.keys(options.form).length) {
        const sanitizedForm = sanitizeObject(options.form);
        await runAction(`Request body: ${JSON.stringify(sanitizedForm)}`, async () => {});
      }

      const response = await this.request.fetch(path, {
        method,
        form: options.form,
        headers: options.headers,
      });
      const body = (await response.json()) as ApiEnvelope<T>;

      await runAction(`Response status: ${response.status()}`, async () => {});

      return { status: response.status(), ok: response.ok(), body };
    });
  }
}
