import { Page } from '@playwright/test';

/**
 * Page Object for the Join Game flow.
 * Covers entering a nickname after navigating to a game room.
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

  /** Enter a nickname and confirm to join the lobby. */
  async enterNickname(nickname: string) {
    await this.page.getByLabel(/nickname|name/i).fill(nickname);
    await this.page.getByRole('button', { name: /join|enter|start/i }).click();
  }

  /** Wait until the waiting-for-host lobby screen is visible. */
  async waitForLobby() {
    await this.page
      .getByText(/waiting|lobby|get ready/i)
      .waitFor({ state: 'visible', timeout: 8_000 });
  }
}
