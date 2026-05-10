export type PaymentCardBrand = 'visa' | 'mastercard' | 'amex' | 'unknown';

export function getCardDigits(cardNumber: string) {
  return cardNumber.replace(/\D/g, '');
}

export function detectCardBrand(cardNumber: string): PaymentCardBrand {
  const digits = getCardDigits(cardNumber);

  if (/^4/.test(digits)) {
    return 'visa';
  }

  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) {
    return 'mastercard';
  }

  if (/^(34|37)/.test(digits)) {
    return 'amex';
  }

  return 'unknown';
}

export function getExpectedCardDigits(brand: PaymentCardBrand) {
  return brand === 'amex' ? 15 : 16;
}

export function formatCardNumber(value: string) {
  const digits = getCardDigits(value).slice(0, 16);
  const brand = detectCardBrand(digits);

  if (brand === 'amex') {
    const partOne = digits.slice(0, 4);
    const partTwo = digits.slice(4, 10);
    const partThree = digits.slice(10, 15);
    return [partOne, partTwo, partThree].filter(Boolean).join(' ');
  }

  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function maskCardNumber(cardNumber: string) {
  const digits = getCardDigits(cardNumber);
  const visible = digits.slice(-4).padStart(4, '0');
  return `•••• •••• •••• ${visible}`;
}
