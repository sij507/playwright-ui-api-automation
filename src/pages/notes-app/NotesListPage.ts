import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class NotesListPage extends BasePage {
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByTestId('search-input');
  }

  async goto(): Promise<void> {
    await this.gotoPath('/notes/app', 'Open Notes App note list');
  }

  /**
   * Authenticates the Notes App session the way the app itself does after a
   * successful login — by seeding `localStorage.token` — so API-created test
   * data can be verified in the UI without re-driving the login form for
   * every scenario. Used for API-setup -> UI-verification integration tests.
   */
  async authenticateViaToken(token: string): Promise<void> {
    await this.perform('Seed authenticated session token', async () => {
      await this.page.goto('/notes/app');
      await this.page.evaluate((t) => localStorage.setItem('token', t), token);
      await this.page.goto('/notes/app');
    });
  }

  noteCard(title: string): Locator {
    return this.page
      .getByTestId('note-card')
      .filter({ has: this.page.getByTestId('note-card-title').getByText(title, { exact: true }) });
  }

  noteCardDescription(title: string): Locator {
    return this.noteCard(title).getByTestId('note-card-description');
  }

  completedToggle(title: string): Locator {
    return this.noteCard(title).getByTestId('toggle-note-switch');
  }

  async toggleCompleted(title: string): Promise<void> {
    await this.perform(`Toggle completed switch for note: ${title}`, () => this.completedToggle(title).click());
  }

  async search(term: string): Promise<void> {
    await this.perform(`Search notes for: ${term}`, () => this.searchInput.fill(term));
  }
}
