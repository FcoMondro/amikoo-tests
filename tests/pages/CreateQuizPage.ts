import { Page } from '@playwright/test';

/**
 * Page Object for the Create/Edit Quiz screen (#/create).
 *
 * All labels confirmed by the app-access exploration agent:
 *   - Quiz title:      label "QUIZ TITLE",          placeholder "World capitals trivia"
 *   - Question text:   label "QUESTION TEXT",        placeholder "What is the capital of France?"
 *   - Time limit:      label "TIME LIMIT (SECONDS)", default value 20
 *   - Answer options:  labels "Option A", "Option B", "Option C", "Option D"
 *   - Correct answer:  label "CORRECT ANSWER" — <select> dropdown,
 *                      values formatted as "A — <option text>", "B — <option text>", etc.
 *   - Save & host:     button "Save & host →"
 *   - Add question:    button "+ Add question"
 *   - Save quiz:       button "Save quiz"
 *   - Cancel:          button "Cancel"
 *   - Preview:         button "▶ Preview"
 *
 * NOTE: The app does NOT have a "Description" field. The first question block
 * is already rendered on page load — "addQuestion" fills the existing one and
 * only clicks "+ Add question" when a second (or later) question is needed.
 */
export class CreateQuizPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('https://kahootlite.vercel.app/#/create');
  }

  /** Fill the "QUIZ TITLE" field. */
  async fillTitle(title: string) {
    await this.page.getByLabel('QUIZ TITLE').fill(title);
  }

  /**
   * Fill question data into the Nth question block (0-based).
   * For the first question (index 0) the block already exists on page load.
   * For subsequent questions, "+ Add question" is clicked first.
   *
   * @param questionText  The question prompt.
   * @param options       Up to 4 answer strings mapped to Option A–D.
   * @param correctIndex  0-based index of the correct answer (0=A, 1=B, 2=C, 3=D).
   * @param questionIndex Which question block to fill (0-based, default 0).
   * @param timeLimitSecs Optional time limit in seconds (default: leave as-is).
   */
  async addQuestion(
    questionText: string,
    options: string[],
    correctIndex: number,
    questionIndex = 0,
    timeLimitSecs?: number,
  ) {
    // Click "+ Add question" for every question after the first
    if (questionIndex > 0) {
      await this.page.getByRole('button', { name: '+ Add question' }).click();
    }

    // All question blocks on the page — target the one at questionIndex
    const questionBlocks = this.page.locator('section, [class*="question"], [class*="card"]');

    // --- Question text ---
    // Use nth() scoped to the block when multiple blocks exist; fall back to label match
    const questionTextareas = this.page.getByLabel('QUESTION TEXT');
    await questionTextareas.nth(questionIndex).fill(questionText);

    // --- Option A / B / C / D ---
    const optionLabels = ['Option A', 'Option B', 'Option C', 'Option D'];
    for (let i = 0; i < options.length && i < 4; i++) {
      const inputs = this.page.getByLabel(optionLabels[i]);
      await inputs.nth(questionIndex).fill(options[i]);
    }

    // --- Time limit (optional) ---
    if (timeLimitSecs !== undefined) {
      const timeLimitInputs = this.page.getByLabel('TIME LIMIT (SECONDS)');
      await timeLimitInputs.nth(questionIndex).fill(String(timeLimitSecs));
    }

    // --- Correct answer dropdown ---
    // The select renders values as "A — <option text>", "B — <option text>", etc.
    const letterMap = ['A', 'B', 'C', 'D'];
    const correctLetter = letterMap[correctIndex];
    const correctSelects = this.page.getByLabel('CORRECT ANSWER');
    await correctSelects.nth(questionIndex).selectOption({ label: new RegExp(`^${correctLetter}`) });
  }

  /**
   * Click "Save & host →" and wait for the game code to appear.
   * Returns the extracted game code string.
   */
  async saveAndHost(): Promise<string> {
    await this.page.getByRole('button', { name: 'Save & host →' }).click();

    // The game code is shown after saving — try data-testid first, then text pattern
    const codeLocator = this.page
      .getByTestId('game-code')
      .or(this.page.locator('[class*="code"]'))
      .or(this.page.getByText(/[A-Z0-9]{4,6}/));

    await codeLocator.first().waitFor({ state: 'visible', timeout: 10_000 });
    const raw = (await codeLocator.first().textContent()) ?? '';
    return raw.trim().replace(/[^A-Z0-9]/gi, '');
  }

  /** Click "Save quiz" (saves without hosting). */
  async saveQuiz() {
    await this.page.getByRole('button', { name: 'Save quiz' }).click();
  }

  /** Click "▶ Preview" to open the preview modal. */
  async preview() {
    await this.page.getByRole('button', { name: '▶ Preview' }).click();
  }

  /** Click "Cancel" to discard changes and return. */
  async cancel() {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
  }
}
