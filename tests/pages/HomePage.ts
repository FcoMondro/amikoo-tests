import { Page } from '@playwright/test';

/**
 * Page Object for the KahootLite landing page (#/).
 * Handles navigation to join a game or create a new quiz.
 */
export class HomePage {
  readonly page: Page;
  readonly BASE_URL = 'https://kahootlite.vercel.app/';

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(this.BASE_URL);
  }

  /** Enter a game code and submit to join a room. */
  async joinGame(code: string) {
    await this.page.getByPlaceholder('ABC123').fill(code);
    await this.page.getByRole('button', { name: /Join game/i }).click();
  }

  /** Click the "+ New quiz" button to navigate to the quiz creator. */
  async clickNewQuiz() {
    await this.page.getByRole('button', { name: /New quiz/i }).click();
  }
}
