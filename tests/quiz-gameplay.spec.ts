import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { CreateQuizPage } from './pages/CreateQuizPage';
import { JoinGamePage } from './pages/JoinGamePage';
import { GameplayPage } from './pages/GameplayPage';

// ---------------------------------------------------------------------------
// Shared quiz data
// ---------------------------------------------------------------------------
const QUIZ_TITLE = 'Quiz de Geografía';
const QUIZ_DESCRIPTION = 'Preguntas de países';
const QUESTION_TEXT = '¿Cuál es la capital de Francia?';
const OPTIONS = ['París', 'Madrid', 'Roma', 'Berlín'];
const CORRECT_ANSWER = 'París';
const WRONG_ANSWER = 'Madrid';
const CORRECT_INDEX = 0; // 'París' is at index 0
const PLAYER_NICKNAME = 'Jugador1';

// ---------------------------------------------------------------------------
// Helper: spin up an isolated browser context (simulates a separate tab/user)
// ---------------------------------------------------------------------------
async function newContext(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  return { context, page };
}

// ---------------------------------------------------------------------------
// TC-01 — Create a quiz with title, description and one question
// ---------------------------------------------------------------------------
test('TC-01 — crear un quiz con preguntas', async ({ page }) => {
  const createPage = new CreateQuizPage(page);

  // Navigate to the quiz creator
  await createPage.goto();

  // Fill quiz metadata
  await createPage.fillTitle(QUIZ_TITLE);
  await createPage.fillDescription(QUIZ_DESCRIPTION);

  // Add a question with 4 options, marking the correct one
  await createPage.addQuestion(QUESTION_TEXT, OPTIONS, CORRECT_INDEX);

  // Save the quiz and start a game room
  const gameCode = await createPage.saveAndHost();

  // A non-empty game code must be produced
  expect(gameCode).toBeTruthy();
  expect(gameCode.length).toBeGreaterThanOrEqual(4);
});

// ---------------------------------------------------------------------------
// TC-02 — Join a game room with a nickname
// ---------------------------------------------------------------------------
test('TC-02 — unirse con nickname', async ({ browser }) => {
  // Host context: create the quiz and obtain the game code
  const { context: hostCtx, page: hostPage } = await newContext(browser);
  const createPage = new CreateQuizPage(hostPage);
  await createPage.goto();
  await createPage.fillTitle(QUIZ_TITLE);
  await createPage.fillDescription(QUIZ_DESCRIPTION);
  await createPage.addQuestion(QUESTION_TEXT, OPTIONS, CORRECT_INDEX);
  const gameCode = await createPage.saveAndHost();

  // Player context: join the room
  const { context: playerCtx, page: playerPage } = await newContext(browser);
  const joinPage = new JoinGamePage(playerPage);
  await joinPage.goto(gameCode);
  await joinPage.enterNickname(PLAYER_NICKNAME);

  // Player should reach the lobby / waiting screen
  await joinPage.waitForLobby();

  // Lobby must show the player's nickname
  await expect(playerPage.getByText(PLAYER_NICKNAME)).toBeVisible();

  await hostCtx.close();
  await playerCtx.close();
});

// ---------------------------------------------------------------------------
// TC-03 — Answer a question correctly
// ---------------------------------------------------------------------------
test('TC-03 — responder correctamente', async ({ browser }) => {
  // --- Host: create quiz and host room ---
  const { context: hostCtx, page: hostPage } = await newContext(browser);
  const createPage = new CreateQuizPage(hostPage);
  await createPage.goto();
  await createPage.fillTitle(QUIZ_TITLE);
  await createPage.fillDescription(QUIZ_DESCRIPTION);
  await createPage.addQuestion(QUESTION_TEXT, OPTIONS, CORRECT_INDEX);
  const gameCode = await createPage.saveAndHost();

  // --- Player: join the room ---
  const { context: playerCtx, page: playerPage } = await newContext(browser);
  const joinPage = new JoinGamePage(playerPage);
  await joinPage.goto(gameCode);
  await joinPage.enterNickname(PLAYER_NICKNAME);
  await joinPage.waitForLobby();

  // --- Host: start the question (click "Start" / "Next" if required) ---
  const startBtn = hostPage.getByRole('button', { name: /start|begin|launch|next/i });
  if (await startBtn.isVisible()) {
    await startBtn.click();
  }

  // --- Player: wait for question and select the correct answer ---
  const gameplay = new GameplayPage(playerPage);
  await gameplay.waitForQuestion();
  await gameplay.selectAnswer(CORRECT_ANSWER);
  await gameplay.submitAnswer();

  // --- Assert: positive feedback is shown ---
  const feedback = await gameplay.getFeedbackLocator();
  await expect(feedback).toBeVisible();
  const feedbackText = (await feedback.textContent()) ?? '';
  expect(feedbackText.toLowerCase()).toMatch(/correct|right|✓|bien/i);

  // --- Assert: score is updated ---
  const score = await gameplay.getScoreLocator();
  await expect(score).toBeVisible();

  await hostCtx.close();
  await playerCtx.close();
});

// ---------------------------------------------------------------------------
// TC-04 — Answer a question incorrectly
// ---------------------------------------------------------------------------
test('TC-04 — responder incorrectamente', async ({ browser }) => {
  // --- Host: create quiz and host room ---
  const { context: hostCtx, page: hostPage } = await newContext(browser);
  const createPage = new CreateQuizPage(hostPage);
  await createPage.goto();
  await createPage.fillTitle(QUIZ_TITLE);
  await createPage.fillDescription(QUIZ_DESCRIPTION);
  await createPage.addQuestion(QUESTION_TEXT, OPTIONS, CORRECT_INDEX);
  const gameCode = await createPage.saveAndHost();

  // --- Player: join the room ---
  const { context: playerCtx, page: playerPage } = await newContext(browser);
  const joinPage = new JoinGamePage(playerPage);
  await joinPage.goto(gameCode);
  await joinPage.enterNickname(PLAYER_NICKNAME);
  await joinPage.waitForLobby();

  // --- Host: start the question ---
  const startBtn = hostPage.getByRole('button', { name: /start|begin|launch|next/i });
  if (await startBtn.isVisible()) {
    await startBtn.click();
  }

  // --- Player: wait for question and select a WRONG answer ---
  const gameplay = new GameplayPage(playerPage);
  await gameplay.waitForQuestion();
  await gameplay.selectAnswer(WRONG_ANSWER);
  await gameplay.submitAnswer();

  // --- Assert: negative feedback is shown ---
  const feedback = await gameplay.getFeedbackLocator();
  await expect(feedback).toBeVisible();
  const feedbackText = (await feedback.textContent()) ?? '';
  expect(feedbackText.toLowerCase()).toMatch(/incorrect|wrong|✗|incorrecto/i);

  // --- Assert: correct answer is revealed ---
  await expect(playerPage.getByText(CORRECT_ANSWER)).toBeVisible();

  await hostCtx.close();
  await playerCtx.close();
});

// ---------------------------------------------------------------------------
// TC-05 — Attempt to submit without selecting an answer
// ---------------------------------------------------------------------------
test('TC-05 — intentar continuar sin seleccionar respuesta', async ({ browser }) => {
  // --- Host: create quiz and host room ---
  const { context: hostCtx, page: hostPage } = await newContext(browser);
  const createPage = new CreateQuizPage(hostPage);
  await createPage.goto();
  await createPage.fillTitle(QUIZ_TITLE);
  await createPage.fillDescription(QUIZ_DESCRIPTION);
  await createPage.addQuestion(QUESTION_TEXT, OPTIONS, CORRECT_INDEX);
  const gameCode = await createPage.saveAndHost();

  // --- Player: join the room ---
  const { context: playerCtx, page: playerPage } = await newContext(browser);
  const joinPage = new JoinGamePage(playerPage);
  await joinPage.goto(gameCode);
  await joinPage.enterNickname(PLAYER_NICKNAME);
  await joinPage.waitForLobby();

  // --- Host: start the question ---
  const startBtn = hostPage.getByRole('button', { name: /start|begin|launch|next/i });
  if (await startBtn.isVisible()) {
    await startBtn.click();
  }

  // --- Player: question is visible, do NOT select any answer ---
  const gameplay = new GameplayPage(playerPage);
  await gameplay.waitForQuestion();

  // Try to submit without selection
  await gameplay.attemptSubmitWithoutSelection();

  // --- Assert: validation error appears ---
  await expect(gameplay.validationError().first()).toBeVisible({ timeout: 5_000 });

  // --- Assert: no premature feedback is shown ---
  const feedbackLocator = playerPage
    .getByTestId('feedback')
    .or(playerPage.getByText(/correct|incorrect|wrong|right/i));
  await expect(feedbackLocator.first()).not.toBeVisible();

  // --- Assert: answer options are still enabled (player can still respond) ---
  await expect(gameplay.answerOptions().first()).toBeEnabled();

  // --- Assert: player CAN still select and submit a valid answer after the error ---
  await gameplay.selectAnswer(CORRECT_ANSWER);
  await gameplay.submitAnswer();
  const feedback = await gameplay.getFeedbackLocator();
  await expect(feedback).toBeVisible();

  await hostCtx.close();
  await playerCtx.close();
});
