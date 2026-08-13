import { Page, expect } from '@playwright/test';

/**
 * Page Object for the KahootLite quiz creator (#/create).
 * Covers: filling metadata, adding questions with options, saving and hosting.
 */
export class CreateQuizPage {
  constructor(private page: Page) {}

  /** Fill the quiz title field */
  async fillTitle(title: string) {
    await this.page.getByLabel(/title/i).fill(title);
  }

  /** Fill the quiz description field */
  async fillDescription(description: string) {
    await this.page.getByLabel(/description/i).fill(description);
  }

  /**
   * Add a question with up to four answer options.
   * @param questionText - The question prompt
   * @param options - Array of { text, correct } for each answer
   */
  async addQuestion(questionText: string, options: { text: string; correct: boolean }[]) {
    // Click "Add Question" to create a new question block
    await this.page.getByRole('button', { name: /add question/i }).click();

    // Fill the question text in the last question block
    const questionBlocks = this.page.locator('[data-testid="question-block"], .question-block, [class*="question"]');
    const lastBlock = questionBlocks.last();
    await lastBlock.getByRole('textbox').first().fill(questionText);

    // Fill each answer option
    for (let i = 0; i < options.length; i++) {
      const optionInputs = lastBlock.getByRole('textbox');
      // Option inputs start at index 1 (index 0 is the question text)
      await optionInputs.nth(i + 1).fill(options[i].text);

      // Mark as correct if specified
      if (options[i].correct) {
        const correctButtons = lastBlock.getByRole('radio').or(
          lastBlock.getByRole('checkbox')
        );
        await correctButtons.nth(i).click();
      }
    }
  }

  /**
   * Click "Save & host →" and return the game code shown on screen.
   * Waits for the code element to appear after saving.
   */
  async saveAndHost(): Promise<string> {
    await this.page.getByRole('button', { name: /save & host/i }).click();

    // Wait for the game code to appear (element varies — try data-testid, then fallback)
    const codeLocator = this.page
      .getByTestId('game-code')
      .or(this.page.locator('[class*="game-code"], [class*="room-code"], [class*="code"]').first());

    await expect(codeLocator).toBeVisible({ timeout: 10_000 });
    return (await codeLocator.textContent()) ?? '';
  }
}
