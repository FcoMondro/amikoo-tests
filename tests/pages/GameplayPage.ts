import { Page, Locator } from '@playwright/test';

/**
 * Page Object for the in-game question/answer screen (player side).
 *
 * ⚠️  The app-access exploration agent did NOT reach the gameplay screen,
 * so selectors here are best-effort fallbacks (data-testid → role → class/text).
 * Each method is annotated with a TODO indicating what to verify in the DOM
 * before running these tests in a real environment.
 */
export class GameplayPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Wait for an active question to appear on screen.
   * TODO: confirm the real heading or element that shows the question text.
   */
  async waitForQuestion() {
    await this.page
      .getByTestId('question-text')
      .or(this.page.getByRole('heading'))
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 });
  }

  /**
   * Return all visible answer option buttons/elements.
   * TODO: inspect the DOM — replace with the real selector once confirmed
   * (e.g. getByRole('button') scoped to an answer list, or getByTestId('answer-option')).
   */
  answerOptions(): Locator {
    return this.page
      .getByTestId('answer-option')
      .or(this.page.locator('[class*="option"], [class*="answer"], [class*="choice"]'))
      .or(this.page.getByRole('button', { name: /^(?!.*(submit|next|skip|confirm)).+/i }));
  }

  /** Click the answer option that contains the given text. */
  async selectAnswer(answerText: string) {
    await this.answerOptions().filter({ hasText: answerText }).click();
  }

  /** Click the answer option at a given 0-based index. */
  async selectAnswerByIndex(index: number) {
    await this.answerOptions().nth(index).click();
  }

  /**
   * Click the submit/confirm button if one exists separately from answer selection.
   * In many quiz apps selecting an option submits automatically — the isVisible
   * guard handles both patterns.
   * TODO: confirm whether KahootLite requires an explicit submit after selection.
   */
  async submitAnswer() {
    const submitBtn = this.page.getByRole('button', { name: /submit|confirm|answer/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }
  }

  /**
   * Attempt to submit without having selected any answer.
   * TODO: confirm whether KahootLite has an explicit submit button, or if the
   * validation fires in another way (e.g. a timer expiry or a "Next" button).
   */
  async attemptSubmitWithoutSelection() {
    const submitBtn = this.page.getByRole('button', { name: /submit|confirm|answer/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }
  }

  /**
   * Wait for and return the feedback element shown after answering.
   * TODO: inspect the DOM after answering to find the real selector —
   * replace getByText pattern with a more specific locator once confirmed.
   */
  async getFeedbackLocator(): Promise<Locator> {
    const feedback = this.page
      .getByTestId('feedback')
      .or(this.page.locator('[class*="feedback"], [class*="result"]'))
      .or(this.page.getByText(/correct|incorrect|wrong|right/i));
    await feedback.first().waitFor({ state: 'visible', timeout: 8_000 });
    return feedback.first();
  }

  /**
   * Wait for and return the score/points element.
   * TODO: inspect the DOM after answering to find the real selector.
   */
  async getScoreLocator(): Promise<Locator> {
    const score = this.page
      .getByTestId('score')
      .or(this.page.locator('[class*="score"], [class*="points"]'))
      .or(this.page.getByText(/score|points|pts/i));
    await score.first().waitFor({ state: 'visible', timeout: 8_000 });
    return score.first();
  }

  /**
   * Return the validation-error locator shown when no answer is selected.
   * TODO: inspect the DOM to find the real validation message element.
   */
  validationError(): Locator {
    return this.page
      .getByTestId('validation-error')
      .or(this.page.getByRole('alert'))
      .or(this.page.getByText(/select|choose|pick.*answer/i));
  }
}
