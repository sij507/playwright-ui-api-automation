import * as dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

export const env = {
  uiBaseUrl: required('UI_BASE_URL', 'https://practice.expandtesting.com'),
  // Trailing slash matters: Playwright's APIRequestContext joins a relative
  // request path onto baseURL using WHATWG URL resolution, which replaces
  // the last path segment of a baseURL that doesn't end in "/" (so
  // ".../notes/api" + "users/login" would resolve to ".../notes/users/login",
  // silently dropping "api"). Every API client path is written without a
  // leading slash to stay relative to this base.
  apiBaseUrl: required('API_BASE_URL', 'https://practice.expandtesting.com/notes/api/'),
  demoUsername: required('DEMO_USERNAME', 'practice'),
  demoPassword: required('DEMO_PASSWORD', 'SuperSecretPassword!'),
  basicAuthUsername: required('BASIC_AUTH_USERNAME', 'admin'),
  basicAuthPassword: required('BASIC_AUTH_PASSWORD', 'admin'),
  isCI: Boolean(process.env.CI),
};
