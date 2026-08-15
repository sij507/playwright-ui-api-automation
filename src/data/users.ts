import { env } from './env';

// Static demo account documented on the /login page itself — safe to hardcode
// since it's a public, intentionally-shared practice credential, not a secret.
export const demoUser = {
  username: env.demoUsername,
  password: env.demoPassword,
};

// A username that does not exist on the system, distinct from the demo
// account, so the API genuinely reports "invalid username" rather than
// coincidentally matching a seeded account.
export const invalidCredentials = {
  username: 'zzz_nonexistent_user',
  password: 'WrongPassword1!',
};

export const longStringInput = 'a'.repeat(500);
export const specialCharacterInput = `!@#$%^&*()_+-=[]{}|;':",./<>?\`~`;

export const loginErrors = {
  invalidUsername: 'Your username is invalid!',
  invalidPassword: 'Your password is invalid!',
};

export const registerErrors = {
  passwordMismatch: 'Passwords do not match.',
  usernameTaken: 'Username is already taken.',
  registerSuccess: 'Successfully registered, you can log in now.',
};

export const secureArea = {
  loginSuccessMessage: 'You logged into a secure area!',
  greeting: (username: string) => `Hi, ${username}!`,
};

// /register enforces this pattern server-side: lowercase letters, numbers,
// and single internal hyphens, 3-39 chars, no leading/trailing hyphen.
export function registerableUsername(): string {
  return `qa-framework-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
