import { test, expect } from '../../src/fixtures/base';
import { apiErrors } from '../../src/data/messages';
import { sampleNote } from '../../src/data/notes';
import { strongPassword, uniqueEmail, uniqueName, uniqueNoteTitle } from '../../src/utils/dataGenerator';

test.describe('Notes API', () => {
  test.describe('Create', () => {
    test(
      'creates a note for the authenticated user',
      { tag: ['@critical', '@regression'] },
      async ({ registeredUser, notesApi, step }) => {
        const note = sampleNote({ title: uniqueNoteTitle(), category: 'Work' });
        let result: Awaited<ReturnType<typeof notesApi.create>>;

        await step.when('the client creates a note', async () => {
          result = await notesApi.create(registeredUser.token, note);
        });

        await step.then('the note is created with the submitted fields', async () => {
          await expect(result.status, 'status code').toBe(200);
          await expect(result.body.data?.title, 'response title').toBe(note.title);
          await expect(result.body.data?.description, 'response description').toBe(note.description);
          await expect(result.body.data?.category, 'response category').toBe('Work');
          await expect(result.body.data?.completed, 'response completed flag').toBe(false);
          await expect(typeof result.body.data?.id, 'response id type').toBe('string');
        });
      },
    );

    test('rejects an unsupported category', { tag: ['@regression'] }, async ({ registeredUser, notesApi, step }) => {
      let result: Awaited<ReturnType<typeof notesApi.create>>;

      await step.when('the client creates a note with an invalid category', async () => {
        // @ts-expect-error -- deliberately invalid to exercise server-side validation
        result = await notesApi.create(registeredUser.token, sampleNote({ category: 'NotACategory' }));
      });

      await step.then('the request is rejected with a category validation error', async () => {
        await expect(result.status, 'status code').toBe(400);
        await expect(result.body.message, 'response message').toBe(apiErrors.invalidCategory);
      });
    });

    test('rejects a title that is too short', { tag: ['@regression'] }, async ({ registeredUser, notesApi, step }) => {
      let result: Awaited<ReturnType<typeof notesApi.create>>;

      await step.when('the client creates a note with a 1-character title', async () => {
        result = await notesApi.create(registeredUser.token, sampleNote({ title: 'a' }));
      });

      await step.then('the request is rejected with a title-length validation error', async () => {
        await expect(result.status, 'status code').toBe(400);
        await expect(result.body.message, 'response message').toBe(apiErrors.titleLength);
      });
    });

    test('rejects a request with no auth token', { tag: ['@regression'] }, async ({ notesApi, step }) => {
      let result: Awaited<ReturnType<typeof notesApi.create>>;

      await step.when('the client creates a note without a token', async () => {
        result = await notesApi.create('', sampleNote());
      });

      await step.then('the request is rejected as unauthorized', async () => {
        await expect(result.status, 'status code').toBe(401);
        await expect(result.body.message, 'response message').toBe(apiErrors.missingAuthToken);
      });
    });
  });

  test.describe('Read', () => {
    test(
      'lists all notes for the authenticated user',
      { tag: ['@critical', '@regression'] },
      async ({ registeredUser, notesApi, step }) => {
        const note = sampleNote({ title: uniqueNoteTitle(), category: 'Personal' });

        await step.given('the user has created one note', async () => {
          await notesApi.create(registeredUser.token, note);
        });

        let result: Awaited<ReturnType<typeof notesApi.getAll>>;
        await step.when('the client lists all notes', async () => {
          result = await notesApi.getAll(registeredUser.token);
        });

        await step.then('the list includes the created note', async () => {
          await expect(result.status, 'status code').toBe(200);
          const titles = result.body.data?.map((n) => n.title) ?? [];
          await expect(titles, 'note titles in response').toContain(note.title);
        });
      },
    );

    test('retrieves a single note by id', { tag: ['@regression'] }, async ({ registeredUser, notesApi, step }) => {
      const note = sampleNote({ title: uniqueNoteTitle() });
      let noteId = '';

      await step.given('the user has created a note', async () => {
        const created = await notesApi.create(registeredUser.token, note);
        noteId = created.body.data!.id;
      });

      let result: Awaited<ReturnType<typeof notesApi.getById>>;
      await step.when('the client fetches the note by id', async () => {
        result = await notesApi.getById(registeredUser.token, noteId);
      });

      await step.then('the note details match what was created', async () => {
        await expect(result.status, 'status code').toBe(200);
        await expect(result.body.data?.title, 'response title').toBe(note.title);
      });
    });

    test(
      'returns 404 for a note id that does not exist',
      { tag: ['@regression'] },
      async ({ registeredUser, notesApi, step }) => {
        let result: Awaited<ReturnType<typeof notesApi.getById>>;

        await step.when('the client fetches a note id that was never created', async () => {
          result = await notesApi.getById(registeredUser.token, '000000000000000000000000');
        });

        await step.then('a not-found error is returned', async () => {
          await expect(result.status, 'status code').toBe(404);
          await expect(result.body.message, 'response message').toBe(apiErrors.noteNotFound);
        });
      },
    );
  });

  test.describe('Update', () => {
    test('replaces a note via PUT', { tag: ['@regression'] }, async ({ registeredUser, notesApi, step }) => {
      let noteId = '';

      await step.given('the user has created a note', async () => {
        const created = await notesApi.create(registeredUser.token, sampleNote());
        noteId = created.body.data!.id;
      });

      const updatedTitle = uniqueNoteTitle('Updated');
      let result: Awaited<ReturnType<typeof notesApi.update>>;
      await step.when('the client replaces the note with new content', async () => {
        result = await notesApi.update(registeredUser.token, noteId, {
          title: updatedTitle,
          description: 'Updated description',
          category: 'Personal',
          completed: true,
        });
      });

      await step.then('the note reflects the new content', async () => {
        await expect(result.status, 'status code').toBe(200);
        await expect(result.body.data?.title, 'response title').toBe(updatedTitle);
        await expect(result.body.data?.category, 'response category').toBe('Personal');
        await expect(result.body.data?.completed, 'response completed flag').toBe(true);
      });
    });

    test(
      'toggles the completed status via PATCH',
      { tag: ['@critical', '@regression'] },
      async ({ registeredUser, notesApi, step }) => {
        let noteId = '';

        await step.given('the user has created an incomplete note', async () => {
          const created = await notesApi.create(registeredUser.token, sampleNote());
          noteId = created.body.data!.id;
        });

        let result: Awaited<ReturnType<typeof notesApi.updateCompletedStatus>>;
        await step.when('the client marks the note as completed', async () => {
          result = await notesApi.updateCompletedStatus(registeredUser.token, noteId, true);
        });

        await step.then('the note is now marked completed', async () => {
          await expect(result.status, 'status code').toBe(200);
          await expect(result.body.data?.completed, 'response completed flag').toBe(true);
        });
      },
    );
  });

  test.describe('Delete', () => {
    test(
      'deletes a note so it can no longer be fetched',
      { tag: ['@critical', '@regression'] },
      async ({ registeredUser, notesApi, step }) => {
        let noteId = '';

        await step.given('the user has created a note', async () => {
          const created = await notesApi.create(registeredUser.token, sampleNote());
          noteId = created.body.data!.id;
        });

        await step.when('the client deletes the note', async () => {
          const result = await notesApi.delete(registeredUser.token, noteId);
          await expect(result.status, 'status code').toBe(200);
        });

        await step.then('fetching the deleted note now returns 404', async () => {
          const getResult = await notesApi.getById(registeredUser.token, noteId);
          await expect(getResult.status, 'status code').toBe(404);
        });
      },
    );

    test(
      'another user cannot access notes they do not own',
      { tag: ['@regression'] },
      async ({ registeredUser, usersApi, notesApi, step }) => {
        let noteId = '';
        let otherToken = '';

        await step.given('user A has created a note', async () => {
          const created = await notesApi.create(registeredUser.token, sampleNote());
          noteId = created.body.data!.id;
        });

        await step.and('user B registers a separate account', async () => {
          const email = uniqueEmail();
          const password = strongPassword();
          await usersApi.register(uniqueName(), email, password);
          const login = await usersApi.login(email, password);
          otherToken = login.body.data!.token;
        });

        let result: Awaited<ReturnType<typeof notesApi.getById>>;
        await step.when("user B requests user A's note by id", async () => {
          result = await notesApi.getById(otherToken, noteId);
        });

        await step.then('the request is rejected as not found', async () => {
          await expect(result.status, 'status code').toBe(404);
        });

        await step.and("user B's account is cleaned up via the API", async () => {
          await usersApi.deleteAccount(otherToken);
        });
      },
    );
  });
});
