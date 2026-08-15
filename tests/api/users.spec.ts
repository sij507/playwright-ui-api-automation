import { test, expect } from '../../src/fixtures/base';
import { apiErrors } from '../../src/data/messages';
import { strongPassword, uniqueEmail, uniqueName } from '../../src/utils/dataGenerator';

test.describe('Users API', () => {
  test.describe('Register', () => {
    test(
      'creates a new account with unique details',
      { tag: ['@critical', '@regression'] },
      async ({ usersApi, step }) => {
        const name = uniqueName();
        const email = uniqueEmail();
        const password = strongPassword();
        let result: Awaited<ReturnType<typeof usersApi.register>>;

        await step.when('the client registers a new account', async () => {
          result = await usersApi.register(name, email, password);
        });

        await step.then('the account is created and echoes the submitted details', async () => {
          await expect(result.status, 'status code').toBe(201);
          await expect(result.body.success, 'response success flag').toBe(true);
          await expect(result.body.data?.name, 'response name').toBe(name);
          await expect(result.body.data?.email, 'response email').toBe(email);
          await expect(typeof result.body.data?.id, 'response id type').toBe('string');
        });

        // Clean up: this test intentionally bypasses the `registeredUser`
        // fixture (it's verifying the register response itself), so it must
        // delete the account it created.
        await step.and('the account is cleaned up via the API', async () => {
          const login = await usersApi.login(email, password);
          await usersApi.deleteAccount(login.body.data!.token);
        });
      },
    );

    test('rejects registering the same email twice', { tag: ['@regression'] }, async ({ usersApi, step }) => {
      const email = uniqueEmail();
      const password = strongPassword();
      let secondAttempt: Awaited<ReturnType<typeof usersApi.register>>;

      await step.given('an account already exists for this email', async () => {
        await usersApi.register(uniqueName(), email, password);
      });

      await step.when('the client registers again with the same email', async () => {
        secondAttempt = await usersApi.register(uniqueName(), email, password);
      });

      await step.then('the duplicate registration is rejected', async () => {
        await expect(secondAttempt.status, 'status code').toBe(409);
        await expect(secondAttempt.body.success, 'response success flag').toBe(false);
        await expect(secondAttempt.body.message, 'response message').toBe(apiErrors.emailAlreadyRegistered);
      });

      await step.and('the account is cleaned up via the API', async () => {
        const login = await usersApi.login(email, password);
        await usersApi.deleteAccount(login.body.data!.token);
      });
    });
  });

  test.describe('Login', () => {
    test(
      'logs in with valid credentials and returns an auth token',
      { tag: ['@smoke', '@critical', '@regression'] },
      async ({ registeredUser, usersApi, step }) => {
        let result: Awaited<ReturnType<typeof usersApi.login>>;

        await step.when('the client logs in with the registered credentials', async () => {
          result = await usersApi.login(registeredUser.email, registeredUser.password);
        });

        await step.then('the response includes a valid auth token', async () => {
          await expect(result.status, 'status code').toBe(200);
          await expect(result.body.data?.email, 'response email').toBe(registeredUser.email);
          await expect(typeof result.body.data?.token, 'response token type').toBe('string');
          await expect(result.body.data?.token.length, 'response token length').toBeGreaterThan(0);
        });
      },
    );

    test('rejects an incorrect password', { tag: ['@regression'] }, async ({ registeredUser, usersApi, step }) => {
      let result: Awaited<ReturnType<typeof usersApi.login>>;

      await step.when('the client logs in with the wrong password', async () => {
        result = await usersApi.login(registeredUser.email, 'WrongPassword1!');
      });

      await step.then('the login is rejected with an incorrect-credentials error', async () => {
        await expect(result.status, 'status code').toBe(401);
        await expect(result.body.message, 'response message').toBe(apiErrors.incorrectLogin);
      });
    });

    test(
      'rejects a login for an email that was never registered',
      { tag: ['@regression'] },
      async ({ usersApi, step }) => {
        let result: Awaited<ReturnType<typeof usersApi.login>>;

        await step.when('the client logs in with an unregistered email', async () => {
          result = await usersApi.login(uniqueEmail(), strongPassword());
        });

        await step.then('the login is rejected with an incorrect-credentials error', async () => {
          await expect(result.status, 'status code').toBe(401);
          await expect(result.body.message, 'response message').toBe(apiErrors.incorrectLogin);
        });
      },
    );
  });

  test.describe('Profile', () => {
    test(
      'retrieves the logged-in user profile',
      { tag: ['@critical', '@regression'] },
      async ({ registeredUser, usersApi, step }) => {
        let result: Awaited<ReturnType<typeof usersApi.getProfile>>;

        await step.when('the client requests its own profile', async () => {
          result = await usersApi.getProfile(registeredUser.token);
        });

        await step.then('the profile matches the registered account', async () => {
          await expect(result.status, 'status code').toBe(200);
          await expect(result.body.data?.email, 'response email').toBe(registeredUser.email);
          await expect(result.body.data?.name, 'response name').toBe(registeredUser.name);
        });
      },
    );

    test(
      'updates the profile name, phone, and company',
      { tag: ['@regression'] },
      async ({ registeredUser, usersApi, step }) => {
        const updatedName = uniqueName('Updated Name');
        let result: Awaited<ReturnType<typeof usersApi.updateProfile>>;

        await step.when('the client updates its profile details', async () => {
          result = await usersApi.updateProfile(registeredUser.token, {
            name: updatedName,
            phone: '5551234567',
            company: 'Expand Testing',
          });
        });

        await step.then('the profile reflects the updated details', async () => {
          await expect(result.status, 'status code').toBe(200);
          await expect(result.body.data?.name, 'response name').toBe(updatedName);
          await expect(result.body.data?.phone, 'response phone').toBe('5551234567');
          await expect(result.body.data?.company, 'response company').toBe('Expand Testing');
        });
      },
    );

    test('rejects a profile request with no auth token', { tag: ['@regression'] }, async ({ usersApi, step }) => {
      let result: Awaited<ReturnType<typeof usersApi.getProfile>>;

      await step.when('the client requests its profile without a token', async () => {
        result = await usersApi.getProfile('');
      });

      await step.then('the request is rejected as unauthorized', async () => {
        await expect(result.status, 'status code').toBe(401);
        await expect(result.body.message, 'response message').toBe(apiErrors.missingAuthToken);
      });
    });

    test(
      'rejects a profile request with an invalid auth token',
      { tag: ['@regression'] },
      async ({ usersApi, step }) => {
        let result: Awaited<ReturnType<typeof usersApi.getProfile>>;

        await step.when('the client requests its profile with a bogus token', async () => {
          result = await usersApi.getProfile('this-token-does-not-exist');
        });

        await step.then('the request is rejected as unauthorized', async () => {
          await expect(result.status, 'status code').toBe(401);
          await expect(result.body.message, 'response message').toBe(apiErrors.invalidAuthToken);
        });
      },
    );
  });

  test.describe('Change password', () => {
    test(
      'changes the password and allows login with the new one',
      { tag: ['@critical', '@regression'] },
      async ({ registeredUser, usersApi, step }) => {
        const newPassword = strongPassword();

        await step.when('the client changes its password', async () => {
          const result = await usersApi.changePassword(registeredUser.token, registeredUser.password, newPassword);
          await expect(result.status, 'status code').toBe(200);
        });

        await step.then('logging in with the new password succeeds', async () => {
          const login = await usersApi.login(registeredUser.email, newPassword);
          await expect(login.status, 'status code').toBe(200);
        });

        await step.and('logging in with the old password no longer works', async () => {
          const login = await usersApi.login(registeredUser.email, registeredUser.password);
          await expect(login.status, 'status code').toBe(401);
        });

        // The registeredUser fixture's teardown expects the *original*
        // password to still work, so this test cleans up under the new one
        // itself instead of relying on that automatic teardown.
        await step.and('the account is cleaned up via the API', async () => {
          const login = await usersApi.login(registeredUser.email, newPassword);
          await usersApi.deleteAccount(login.body.data!.token);
        });
      },
    );
  });

  test.describe('Logout', () => {
    test(
      'invalidates the token so it can no longer authenticate',
      { tag: ['@critical', '@regression'] },
      async ({ registeredUser, usersApi, step }) => {
        await step.when('the client logs out', async () => {
          const result = await usersApi.logout(registeredUser.token);
          await expect(result.status, 'status code').toBe(200);
        });

        await step.then('the same token can no longer access protected endpoints', async () => {
          const profile = await usersApi.getProfile(registeredUser.token);
          await expect(profile.status, 'status code').toBe(401);
        });
      },
    );
  });

  test.describe('Delete account', () => {
    test(
      'deletes the account so its credentials stop working',
      { tag: ['@regression'] },
      async ({ usersApi, step }) => {
        const email = uniqueEmail();
        const password = strongPassword();
        let token = '';

        await step.given('a throwaway account is registered', async () => {
          await usersApi.register(uniqueName(), email, password);
          const login = await usersApi.login(email, password);
          token = login.body.data!.token;
        });

        await step.when('the client deletes its own account', async () => {
          const result = await usersApi.deleteAccount(token);
          await expect(result.status, 'status code').toBe(200);
        });

        await step.then('logging in with the deleted account no longer works', async () => {
          const login = await usersApi.login(email, password);
          await expect(login.status, 'status code').toBe(401);
        });
      },
    );
  });
});
