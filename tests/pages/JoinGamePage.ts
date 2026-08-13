import { Page, expect } from '@playwright/test';

/**
 * Page Object for the KahootLite join-game flow (#/join/:gameCode).
 * Covers: entering nickname, waiting in the lobby.
 */
export class JoinGamePage {
  constructor(private page: Page) {}

  /**
   * Enter a nickname and confirm to join the lobby.
   * Waits for the waiting screen to appear.
   */
  async enterNickname(nickname: string) {
    const nicknameInput = this.page
      .getByLabel(/nickname/i)
      .or(this.page.getByPlaceholder(/nickname|name/i));

    await expect(nicknameInput).toBeVisible({ timeout: 8_000 });
    await nicknameInput.fill(nickname);

    // Confirm — try a "Join" button first, then form submit
    const joinBtn = this.page.getByRole('button', { name: /join|enter|start/i });
    await joinBtn.click();
  }

  /** Wait for the "waiting for host" lobby screen */
  async waitForLobby() {
    const waitingText = this.page.getByText(/waiting for host|waiting\.\.\.|lobby/i);
    await expect(waitingText).toBeVisible({ timeout: 10_000 });
  }
}
