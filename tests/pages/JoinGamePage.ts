import { Page } from '@playwright/test';

/**
 * Page Object for the Join Game flow.
 *
 * Route confirmed by app-access agent: #/join/:gameCode
 * The home page "Join game →" button navigates here after entering the code.
 *
 * NOTE: The agent did not reach the in-room nickname screen, so the
 * nickname input/button selectors use broad role/label matchers as a
 * best-effort fallback until the DOM is inspected directly.
 */
export class JoinGamePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Navigate directly to a game room by code. */
  async goto(gameCode: string) {
    await this.page.goto(`https://kahootlite.vercel.app/#/join/${gameCode}`);
  }

  /**
   * Enter a nickname and confirm to join the lobby.
   * Selector uses broad matchers — update once the real label is confirmed
   * by inspecting the DOM on the join screen.
   */
  async enterNickname(nickname: string) {
    await this.page.getByLabel(/nickname|name/i).fill(nickname);
    await this.page.getByRole('button', { name: /join|enter|start/i }).click();
  }

  /**
   * Wait until the waiting-for-host lobby is visible.
   * Selector uses broad text matchers — update once real copy is confirmed.
   */
  async waitForLobby() {
    await this.page
      .getByText(/waiting|lobby|get ready/i)
      .waitFor({ state: 'visible', timeout: 8_000 });
  }
}
