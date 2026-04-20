import { Page, Locator } from '@playwright/test';

export class RadioButtonsPage {
  // ─── Color Radio Group ─────────────────────────────────────────────────────
  private readonly blueRadio: Locator;
  private readonly redRadio: Locator;
  private readonly yellowRadio: Locator;
  private readonly blackRadio: Locator;
  private readonly greenRadio: Locator;

  // ─── Sport Radio Group ─────────────────────────────────────────────────────
  private readonly basketballRadio: Locator;
  private readonly footballRadio: Locator;
  private readonly tennisRadio: Locator;

  constructor(private page: Page) {
    // Color group
    this.blueRadio = page.locator('#blue');
    this.redRadio = page.locator('#red');
    this.yellowRadio = page.locator('#yellow');
    this.blackRadio = page.locator('#black');
    this.greenRadio = page.locator('#green');

    // Sport group
    this.basketballRadio = page.locator('#basketball');
    this.footballRadio = page.locator('#football');
    this.tennisRadio = page.locator('#tennis');
  }

  async goto() {
    await this.page.goto('/radio-buttons', { waitUntil: 'domcontentloaded' });
  }

  // ─── Color Getters ─────────────────────────────────────────────────────────

  getBlueRadio(): Locator {
    return this.blueRadio;
  }

  getRedRadio(): Locator {
    return this.redRadio;
  }

  getYellowRadio(): Locator {
    return this.yellowRadio;
  }

  getBlackRadio(): Locator {
    return this.blackRadio;
  }

  getGreenRadio(): Locator {
    return this.greenRadio;
  }

  // ─── Color Actions ─────────────────────────────────────────────────────────

  async selectColor(color: 'blue' | 'red' | 'yellow' | 'black') {
    await this.page.locator(`#${color}`).check();
  }

  // ─── Sport Getters ─────────────────────────────────────────────────────────

  getBasketballRadio(): Locator {
    return this.basketballRadio;
  }

  getFootballRadio(): Locator {
    return this.footballRadio;
  }

  getTennisRadio(): Locator {
    return this.tennisRadio;
  }

  // ─── Sport Actions ─────────────────────────────────────────────────────────

  async selectSport(sport: 'basketball' | 'football' | 'tennis') {
    await this.page.locator(`#${sport}`).check();
  }

  // ─── Label Getters ─────────────────────────────────────────────────────────

  getColorLabel(color: string): Locator {
    // Green's label is missing the for attribute, so locate via the parent container
    return this.page.locator(`#${color}`).locator('..').locator('.form-check-label');
  }

  getSportLabel(sport: string): Locator {
    return this.page.locator(`label[for="${sport}"]`);
  }
}
