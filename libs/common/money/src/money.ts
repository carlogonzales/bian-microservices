import Decimal from "decimal.js";

export class Money {
  readonly value: Decimal;
  readonly currency: string;

  constructor(value: string | number, currency: string) {
    this.value = new Decimal(value);
    this.currency = currency.toUpperCase();
  }

  static of(value: string, currency: string) {
    return new Money(value, currency);
  }

  ensurePositive() {
    if (this.value.lte(0)) {
      throw new Error("Amount must be > 0");
    }
    return this;
  }

  toJSON() {
    return {
      value: this.value.toFixed(),
      currency: this.currency
    };
  }
}