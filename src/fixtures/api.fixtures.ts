import { test as base, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { env } from '../data/env';
import { HealthApiClient } from '../api/HealthApiClient';
import { NotesApiClient } from '../api/NotesApiClient';
import { UsersApiClient } from '../api/UsersApiClient';
import type { LoggedInUser } from '../api/types';
import { strongPassword, uniqueEmail, uniqueName } from '../utils/dataGenerator';

export interface ApiFixtures {
  apiContext: APIRequestContext;
  healthApi: HealthApiClient;
  usersApi: UsersApiClient;
  notesApi: NotesApiClient;
  /**
   * A fresh, unique user account registered through the Notes API before the
   * test runs and deleted through the API after it — API-based setup and
   * cleanup so tests never depend on (or pollute) shared account state.
   */
  registeredUser: LoggedInUser & { password: string };
}

export const test = base.extend<ApiFixtures>({
  // eslint-disable-next-line no-empty-pattern -- Playwright fixture DI requires a destructured first param even when unused.
  apiContext: async ({}, use) => {
    const context = await playwrightRequest.newContext({ baseURL: env.apiBaseUrl });
    await use(context);
    await context.dispose();
  },

  healthApi: async ({ apiContext }, use) => {
    await use(new HealthApiClient(apiContext));
  },
  usersApi: async ({ apiContext }, use) => {
    await use(new UsersApiClient(apiContext));
  },
  notesApi: async ({ apiContext }, use) => {
    await use(new NotesApiClient(apiContext));
  },

  registeredUser: async ({ usersApi }, use) => {
    const name = uniqueName();
    const email = uniqueEmail();
    const password = strongPassword();

    await usersApi.register(name, email, password);
    const loginResult = await usersApi.login(email, password);
    const user: LoggedInUser & { password: string } = { ...loginResult.body.data!, password };

    await use(user);

    await usersApi.deleteAccount(user.token).catch(() => {
      // Already deleted by the test itself (e.g. a delete-account test) — safe to ignore.
    });
  },
});

export const expect = base.expect;
