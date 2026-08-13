import { Page } from '@playwright/test';

/**
 * Page Object for the KahootLite landing page (#/).
 *
 * Labels/text confirmed by the app-access exploration agent:
 *   - Game code input: placeholder "ABC123"
 *   - Join button: "Join game →"
 *   - New quiz button: "+ New quiz"
 *   - My quizzes button: "My quizzes"
 *   - Theme toggle: aria-label "Toggle theme", shows "☀️" / "🌙"
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

  /** Enter a game code and click "Join game →". */
  async joinGame(code: string) {
    await this.page.getByPlaceholder('ABC123').fill(code);
    await this.page.getByRole('button', { name: 'Join game →' }).click();
  }

  /** Click "+ New quiz" to navigate to the quiz creator. */
  async clickNewQuiz() {
    await this.page.getByRole('button', { name: '+ New quiz' }).click();
  }

  /** Click "My quizzes" to navigate to the quiz library. */
  async clickMyQuizzes() {
    await this.page.getByRole('button', { name: 'My quizzes' }).click();
  }
}
