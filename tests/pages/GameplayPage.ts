import { Page, Locator } from '@playwright/test';

/**
 * Page Object for the in-game question/answer screen (player side).
 * Covers selecting an answer, submitting, and reading feedback.
 */
export class GameplayPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Wait for an active question to appear on screen. */
  async waitForQuestion() {
    await this.page
      .getByRole('heading')
      .or(this.page.getByTestId('question-text'))
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Return all visible answer option buttons/labels. */
  answerOptions(): Locator {
    return this.page
      .getByTestId('answer-option')
      .or(this.page.getByRole('button', { name: /^(?!.*submit|next|skip).+/i }))
      .or(this.page.locator('[class*="option"], [class*="answer"], [class*="choice"]'));
  }

  /** Click the answer option that matches the given text. */
  async selectAnswer(answerText: string) {
    await this.answerOptions().filter({ hasText: answerText }).click();
  }

  /** Click the answer option at a given 0-based index. */
  async selectAnswerByIndex(index: number) {
    await this.answerOptions().nth(index).click();
  }

  /** Click the submit / confirm button (if separate from answer selection). */
  async submitAnswer() {
    const submitBtn = this.page.getByRole('button', { name: /submit|confirm|answer/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }
    // If no separate submit button exists, selection itself confirms the answer.
  }

  /**
   * Attempt to submit without selecting any answer.
   * Clicks the submit button if present; does nothing if the app auto-submits.
   */
  async attemptSubmitWithoutSelection() {
    const submitBtn = this.page.getByRole('button', { name: /submit|confirm|answer/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }
  }

  /** Wait for and return the feedback element (correct / incorrect indicator). */
  async getFeedbackLocator(): Promise<Locator> {
    const feedback = this.page
      .getByTestId('feedback')
      .or(this.page.getByText(/correct|incorrect|wrong|right/i))
      .or(this.page.locator('[class*="feedback"], [class*="result"]'));
    await feedback.first().waitFor({ state: 'visible', timeout: 8_000 });
    return feedback.first();
  }

  /** Wait for and return the score/points element. */
  async getScoreLocator(): Promise<Locator> {
    const score = this.page
      .getByTestId('score')
      .or(this.page.getByText(/score|points|pts/i))
      .or(this.page.locator('[class*="score"], [class*="points"]'));
    await score.first().waitFor({ state: 'visible', timeout: 8_000 });
    return score.first();
  }

  /** Return the validation-error locator (no answer selected). */
  validationError(): Locator {
    return this.page
      .getByTestId('validation-error')
      .or(this.page.getByRole('alert'))
      .or(this.page.getByText(/select|choose|pick.*answer/i));
  }
}
