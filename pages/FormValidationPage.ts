import { Page, Locator } from '@playwright/test';

export type PaymentMethod = 'cashondelivery' | 'card';

export interface FormValidationData {
  contactName?: string;
  contactNumber?: string;
  pickUpDate?: string;
  payment?: PaymentMethod;
}

export class FormValidationPage {
  private readonly contactNameInput: Locator;
  private readonly contactNumberInput: Locator;
  private readonly pickUpDateInput: Locator;
  private readonly paymentSelect: Locator;
  private readonly chooseOption: Locator;
  private readonly submitButton: Locator;

  private readonly contactNameError: Locator;
  private readonly contactNumberError: Locator;
  private readonly pickUpDateError: Locator;
  private readonly paymentError: Locator;

  private readonly confirmationAlert: Locator;

  constructor(private page: Page) {
    this.contactNameInput = page.locator('#validationCustom01');
    // Contact Number and PickUp Date share id="validationCustom05" on the live site,
    // so locate them by unique name attribute instead.
    this.contactNumberInput = page.locator('[name="contactnumber"]');
    this.pickUpDateInput = page.locator('[name="pickupdate"]');
    this.paymentSelect = page.locator('#validationCustom04');
    this.chooseOption = this.paymentSelect.locator('option[value=""]');
    this.submitButton = page.locator('button[type="submit"]');

    this.contactNameError = this.contactNameInput.locator('~ .invalid-feedback');
    this.contactNumberError = this.contactNumberInput.locator('~ .invalid-feedback');
    this.pickUpDateError = this.pickUpDateInput.locator('~ .invalid-feedback');
    this.paymentError = this.paymentSelect.locator('~ .invalid-feedback');

    this.confirmationAlert = page.locator('.alert.alert-info');
  }

  async goto() {
    await this.page.goto('/form-validation', { waitUntil: 'domcontentloaded' });
  }

  async setContactName(value: string) {
    await this.contactNameInput.clear();
    await this.contactNameInput.fill(value);
  }

  async setContactNumber(value: string) {
    await this.contactNumberInput.clear();
    await this.contactNumberInput.fill(value);
  }

  async setPickUpDate(value: string) {
    await this.pickUpDateInput.clear();
    await this.pickUpDateInput.fill(value);
  }

  async setPayment(value: PaymentMethod) {
    await this.paymentSelect.selectOption(value);
  }

  async clearAll() {
    await this.contactNameInput.clear();
    await this.contactNumberInput.clear();
    await this.pickUpDateInput.clear();
  }

  async fillForm(data: FormValidationData) {
    if (data.contactName !== undefined) await this.setContactName(data.contactName);
    if (data.contactNumber !== undefined) await this.setContactNumber(data.contactNumber);
    if (data.pickUpDate !== undefined) await this.setPickUpDate(data.pickUpDate);
    if (data.payment !== undefined) await this.setPayment(data.payment);
  }

  async submit() {
    await this.submitButton.click();
  }

  async submitEmpty() {
    await this.clearAll();
    await this.submitButton.click();
  }

  async submitWith(data: FormValidationData) {
    await this.fillForm(data);
    await this.submit();
  }

  getContactNameInput(): Locator {
    return this.contactNameInput;
  }

  getContactNumberInput(): Locator {
    return this.contactNumberInput;
  }

  getPickUpDateInput(): Locator {
    return this.pickUpDateInput;
  }

  getPaymentSelect(): Locator {
    return this.paymentSelect;
  }

  getChooseOption(): Locator {
    return this.chooseOption;
  }

  getContactNameError(): Locator {
    return this.contactNameError;
  }

  getContactNumberError(): Locator {
    return this.contactNumberError;
  }

  getPickUpDateError(): Locator {
    return this.pickUpDateError;
  }

  getPaymentError(): Locator {
    return this.paymentError;
  }

  getConfirmationAlert(): Locator {
    return this.confirmationAlert;
  }
}
