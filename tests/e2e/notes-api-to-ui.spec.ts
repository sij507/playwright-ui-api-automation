import { test, expect } from '../../src/fixtures/base';
import { sampleNote } from '../../src/data/notes';
import { uniqueNoteTitle } from '../../src/utils/dataGenerator';

// API setup -> UI verification -> API cleanup: notes are created and torn
// down entirely through the Notes API (registeredUser's fixture teardown
// deletes the account, which cascades the notes with it), while the actual
// assertion — that the created data is genuinely visible to a user — is
// made through the real Notes App UI. Driving the UI just to create setup
// data would add nothing here, so the API does all of the setup work.
test.describe('Notes: API setup -> UI verification', () => {
  test(
    'a note created through the API appears in the Notes App UI',
    { tag: ['@critical', '@regression'] },
    async ({ registeredUser, notesApi, notesListPage, step }) => {
      const note = sampleNote({
        title: uniqueNoteTitle('API Created'),
        description: 'Created via API for UI verification',
        category: 'Work',
      });

      await step.given('a note has been created through the Notes API', async () => {
        await notesApi.create(registeredUser.token, note);
      });

      await step.when('the user opens the Notes App with an authenticated session', async () => {
        await notesListPage.authenticateViaToken(registeredUser.token);
      });

      await step.then('the API-created note is visible in the UI with its correct details', async () => {
        await expect(notesListPage.noteCard(note.title), 'note card').toBeVisible();
        await expect(notesListPage.noteCardDescription(note.title)).toHaveText(note.description);
      });
    },
  );

  test(
    'a note deleted through the API disappears from the Notes App UI after refresh',
    { tag: ['@regression'] },
    async ({ registeredUser, notesApi, notesListPage, page, step }) => {
      const note = sampleNote({ title: uniqueNoteTitle('To Be Deleted') });
      let noteId = '';

      await step.given('a note exists and is visible in the UI', async () => {
        const created = await notesApi.create(registeredUser.token, note);
        noteId = created.body.data!.id;
        await notesListPage.authenticateViaToken(registeredUser.token);
        await expect(notesListPage.noteCard(note.title), 'note card').toBeVisible();
      });

      await step.when('the note is deleted through the API', async () => {
        await notesApi.delete(registeredUser.token, noteId);
      });

      await step.then('the note is no longer shown after the UI refreshes', async () => {
        await page.reload();
        await expect(notesListPage.noteCard(note.title)).toHaveCount(0);
      });
    },
  );
});
