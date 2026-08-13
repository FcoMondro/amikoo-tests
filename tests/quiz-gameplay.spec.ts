import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { CreateQuizPage } from './pages/CreateQuizPage';
import { JoinGamePage } from './pages/JoinGamePage';
import { GameplayPage } from './pages/GameplayPage';

/**
 * KahootLite is a frontend-only multiplayer quiz app that syncs across browser
 * tabs via localStorage. Host and player must run in SEPARATE browser contexts
 * so they don't share storage — this mirrors the real two-tab experience.
 *
 * Coverage:
 *   TC-01 — Create a quiz with questions
 *   TC-02 — Join a game with a nickname
 *   TC-03 — Answer correctly
 *   TC-04 — Answer incorrectly
 *   TC-05 — Try to continue without selecting an answer
 */

const QUIZ_TITLE = 'Quiz de Geografía';
const QUIZ_DESC = 'Preguntas de países';
const QUESTION_TEXT = '¿Capital de Francia?';
const CORRECT_ANSWER = 'París';
const WRONG_ANSWER = 'Madrid';
const OPTIONS = [
  { text: CORRECT_ANSWER, correct: true },
  { text: WRONG_ANSWER, correct: false },
  { text: 'Roma', correct: false },
  { text: 'Berlín', correct: false },
];
const PLAYER_NICKNAME = 'Jugador1';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Create a fresh isolated browser context (simulates a separate tab/user) */
async function newContext(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  return { context, page };
}

/** Set up host context: go home, create quiz, save and host. Returns game code. */
async function setupHostAndGetCode(browser: Browser): Promise<{ hostContext: BrowserContext; gameCode: string }> {
  const { context: hostContext, page: hostPage } = await newContext(browser);

  const home = new HomePage(hostPage);
  await home.goto();
  await home.clickNewQuiz();

  const creator = new CreateQuizPage(hostPage);
  await creator.fillTitle(QUIZ_TITLE);
  await creator.fillDescription(QUIZ_DESC);
  await creator.addQuestion(QUESTION_TEXT, OPTIONS);
  const gameCode = await creator.saveAndHost();

  return { hostContext, gameCode };
}

/** Set up player context: join game with code, enter nickname, wait for lobby. */
async function setupPlayer(browser: Browser, gameCode: string): Promise<{ playerContext: BrowserContext; playerPage: Page }> {
  const { context: playerContext, page: playerPage } = await newContext(browser);

  const home = new HomePage(playerPage);
  await home.goto();
  await home.joinGame(gameCode);

  const joinPage = new JoinGamePage(playerPage);
  await joinPage.enterNickname(PLAYER_NICKNAME);
  await joinPage.waitForLobby();

  return { playerContext, playerPage };
}

// ─── TC-01: Create a quiz with questions ─────────────────────────────────────

test('TC-01 — crear un quiz con preguntas y obtener código de sala', async ({ browser }) => {
  const { context, page } = await newContext(browser);

  // Navigate to home and open quiz creator
  const home = new HomePage(page);
  await home.goto();
  await home.clickNewQuiz();

  // Fill quiz metadata
  const creator = new CreateQuizPage(page);
  await creator.fillTitle(QUIZ_TITLE);
  await creator.fillDescription(QUIZ_DESC);

  // Add a question with four options, one correct
  await creator.addQuestion(QUESTION_TEXT, OPTIONS);

  // Save and host — a game code must appear
  const gameCode = await creator.saveAndHost();
  expect(gameCode.trim()).not.toBe('');

  await context.close();
});

// ─── TC-02: Join a game with a nickname ──────────────────────────────────────

test('TC-02 — unirse a un quiz con nickname y esperar en lobby', async ({ browser }) => {
  // Host creates and starts the room
  const { hostContext, gameCode } = await setupHostAndGetCode(browser);

  // Player joins in a separate context
  const { playerContext } = await setupPlayer(browser, gameCode.trim());

  await hostContext.close();
  await playerContext.close();
});

// ─── TC-03: Answer correctly ─────────────────────────────────────────────────

test('TC-03 — responder correctamente una pregunta', async ({ browser }) => {
  // Host creates room
  const { hostContext, gameCode } = await setupHostAndGetCode(browser);

  // Player joins
  const { playerContext, playerPage } = await setupPlayer(browser, gameCode.trim());
  const gameplay = new GameplayPage(playerPage);

  // Wait for the question to appear (host starts it or it auto-starts)
  await gameplay.waitForQuestion();

  // Select the correct answer
  await gameplay.selectAnswer(CORRECT_ANSWER);
  await gameplay.submitAnswer();

  // Expect positive feedback and a score
  await gameplay.expectCorrectFeedback();
  await gameplay.expectScoreVisible();

  await hostContext.close();
  await playerContext.close();
});

// ─── TC-04: Answer incorrectly ───────────────────────────────────────────────

test('TC-04 — responder incorrectamente una pregunta', async ({ browser }) => {
  // Host creates room
  const { hostContext, gameCode } = await setupHostAndGetCode(browser);

  // Player joins
  const { playerContext, playerPage } = await setupPlayer(browser, gameCode.trim());
  const gameplay = new GameplayPage(playerPage);

  // Wait for question
  await gameplay.waitForQuestion();

  // Select a wrong answer
  await gameplay.selectAnswer(WRONG_ANSWER);
  await gameplay.submitAnswer();

  // Expect negative feedback and the correct answer to be highlighted
  await gameplay.expectIncorrectFeedback();
  await gameplay.expectCorrectAnswerHighlighted(CORRECT_ANSWER);

  await hostContext.close();
  await playerContext.close();
});

// ─── TC-05: Try to continue without selecting an answer ──────────────────────

test('TC-05 — intentar continuar sin seleccionar una respuesta', async ({ browser }) => {
  // Host creates room
  const { hostContext, gameCode } = await setupHostAndGetCode(browser);

  // Player joins
  const { playerContext, playerPage } = await setupPlayer(browser, gameCode.trim());
  const gameplay = new GameplayPage(playerPage);

  // Wait for question — no option selected
  await gameplay.waitForQuestion();

  // Attempt to submit without selecting anything
  await gameplay.submitAnswer();

  // App should block progress and show a validation message
  await gameplay.expectValidationMessage();

  // Options must remain enabled so the player can still answer
  await gameplay.expectOptionsEnabled();

  // Confirm the player can now recover and answer correctly
  await gameplay.selectAnswer(CORRECT_ANSWER);
  await gameplay.submitAnswer();
  await gameplay.expectCorrectFeedback();

  await hostContext.close();
  await playerContext.close();
});
