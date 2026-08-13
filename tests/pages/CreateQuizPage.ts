import { Page } from '@playwright/test';

/**
 * Page Object for the Create/Edit Quiz screen (#/create).
 * Handles filling quiz metadata, adding questions, and saving.
 */
export class CreateQuizPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('https://kahootlite.vercel.app/#/create');
  }

  /** Fill the quiz title field. */
  async fillTitle(title: string) {
    await this.page.getByLabel(/title/i).fill(title);
  }

  /** Fill the quiz description field. */
  async fillDescription(description: string) {
    await this.page.getByLabel(/description/i).fill(description);
  }

  /**
   * Add a question with up to 4 answer options.
   * @param questionText  The question body.
   * @param options       Array of answer strings (max 4).
   * @param correctIndex  0-based index of the correct answer.
   */
  async addQuestion(questionText: string, options: string[], correctIndex: number) {
    await this.page.getByRole('button', { name: /add question/i }).click();

    // Fill the question text — target the last question block added
    const questionInputs = this.page.getByLabel(/question/i);
    await questionInputs.last().fill(questionText);

    // Fill each option and mark the correct one
    for (let i = 0; i < options.length; i++) {
      const optionInputs = this.page.getByLabel(new RegExp(`option|answer|choice`, 'i'));
      await optionInputs.nth(i).fill(options[i]);
    }

    // Mark correct answer (radio button or checkbox next to the option)
    const correctMarkers = this.page.getByRole('radio').or(
      this.page.getByLabel(/correct/i)
    );
    await correctMarkers.nth(correctIndex).click();
  }

  /**
   * Click "Save & host →" to save the quiz and start a game room.
   * Returns the game code extracted from the page after saving.
   */
  async saveAndHost(): Promise<string> {
    await this.page.getByRole('button', { name: /save.*host/i }).click();

    // Wait for the game code to appear (format: 4-6 alphanumeric chars)
    const codeLocator = this.page
      .getByTestId('game-code')
      .or(this.page.locator('[class*="code"]'))
      .or(this.page.getByText(/[A-Z0-9]{4,6}/));

    await codeLocator.waitFor({ state: 'visible', timeout: 10_000 });
    const code = (await codeLocator.first().textContent()) ?? '';
    return code.trim().replace(/[^A-Z0-9]/gi, '');
  }
}
