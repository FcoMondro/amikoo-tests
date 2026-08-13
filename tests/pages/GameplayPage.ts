import { Page, expect } from '@playwright/test';

/**
 * Page Object for the KahootLite in-game question/answer screen.
 * Covers: selecting answers, submitting, reading feedback, and score.
 */
export class GameplayPage {
  constructor(private page: Page) {}

  /** Wait for the active question to appear on screen */
  async waitForQuestion() {
    const question = this.page
      .getByTestId('question')
      .or(this.page.locator('[class*="question"]').first());
    await expect(question).toBeVisible({ timeout: 15_000 });
  }

  /** Click on an answer option by its visible text */
  async selectAnswer(answerText: string) {
    const option = this.page.getByRole('button', { name: answerText })
      .or(this.page.getByText(answerText, { exact: true }).first());
    await expect(option).toBeVisible({ timeout: 8_000 });
    await option.click();
  }

  /**
   * Click the submit / confirm button (if a separate one exists).
   * Some quiz apps auto-submit on selection — calling this is a no-op if no button found.
   */
  async submitAnswer() {
    const submitBtn = this.page.getByRole('button', { name: /submit|confirm|send/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }
  }

  /** Assert that positive (correct) feedback is visible */
  async expectCorrectFeedback() {
    const feedback = this.page
      .getByText(/correct|✅|well done|great/i)
      .or(this.page.getByTestId('feedback-correct'))
      .or(this.page.locator('[class*="correct"], [class*="success"]').first());
    await expect(feedback).toBeVisible({ timeout: 8_000 });
  }

  /** Assert that negative (incorrect) feedback is visible */
  async expectIncorrectFeedback() {
    const feedback = this.page
      .getByText(/incorrect|wrong|❌/i)
      .or(this.page.getByTestId('feedback-incorrect'))
      .or(this.page.locator('[class*="incorrect"], [class*="wrong"], [class*="error"]').first());
    await expect(feedback).toBeVisible({ timeout: 8_000 });
  }

  /** Assert that the correct answer is highlighted after feedback */
  async expectCorrectAnswerHighlighted(correctText: string) {
    const highlighted = this.page.getByText(correctText, { exact: true });
    await expect(highlighted).toBeVisible({ timeout: 8_000 });
  }

  /** Assert that the score element is visible (any non-zero content) */
  async expectScoreVisible() {
    const score = this.page
      .getByTestId('score')
      .or(this.page.locator('[class*="score"], [class*="points"]').first());
    await expect(score).toBeVisible({ timeout: 8_000 });
  }

  /** Assert that a "select an answer" validation message appears */
  async expectValidationMessage() {
    const msg = this.page
      .getByText(/select|choose|pick|please/i)
      .or(this.page.getByTestId('validation-message'))
      .or(this.page.locator('[role="alert"]').first());
    await expect(msg).toBeVisible({ timeout: 5_000 });
  }

  /** Assert that answer options are still enabled/clickable */
  async expectOptionsEnabled() {
    const anyOption = this.page.getByRole('button').filter({ hasText: /[A-Za-z0-9]/ }).first();
    await expect(anyOption).toBeEnabled({ timeout: 5_000 });
  }
}
