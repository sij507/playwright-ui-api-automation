import { test, expect } from '../../src/fixtures/base';
import { sampleNote } from '../../src/data/notes';
import { uniqueNoteTitle } from '../../src/utils/dataGenerator';

// UI action -> API verification: the note itself is seeded through the API
// (setup that adds no testing value to drive through the UI), but the
// action under test — toggling a note's completed state — is performed for
// real through the Notes App UI, then verified against the backend via the
// API to confirm the UI action genuinely persisted.
test.describe('Notes: UI action -> API verification', () => {
  test(
    'toggling a note completed in the UI persists to the backend',
    { tag: ['@critical', '@regression'] },
    async ({ registeredUser, notesApi, notesListPage, step }) => {
      const note = sampleNote({ title: uniqueNoteTitle('Toggle Me') });
      let noteId = '';

      await step.given('an incomplete note exists and is open in the Notes App UI', async () => {
        const created = await notesApi.create(registeredUser.token, note);
        noteId = created.body.data!.id;
        await notesListPage.authenticateViaToken(registeredUser.token);
      });

      await step.when('the user toggles the note as completed in the UI', async () => {
        await notesListPage.toggleCompleted(note.title);
      });

      await step.then('the API reports the note as completed', async () => {
        await expect
          .poll(async () => (await notesApi.getById(registeredUser.token, noteId)).body.data?.completed)
          .toBe(true);
      });
    },
  );
});
