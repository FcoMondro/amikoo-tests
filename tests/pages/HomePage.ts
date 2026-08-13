import { Page } from '@playwright/test';

const BASE_URL = 'https://kahootlite.vercel.app/';

/**
 * Page Object for the KahootLite landing page (#/).
 * Covers the "Have a code?" join section and "Host a quiz" section.
 */
export class HomePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(BASE_URL);
  }

  /** Enter a game code and click "Join game →" */
  async joinGame(code: string) {
    await this.page.getByPlaceholder('ABC123').fill(code);
    await this.page.getByRole('button', { name: 'Join game →' }).click();
  }

  /** Click "+ New quiz" to navigate to the quiz creator */
  async clickNewQuiz() {
    await this.page.getByRole('button', { name: '+ New quiz' }).click();
  }
}
