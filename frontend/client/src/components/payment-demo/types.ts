export type PaymentFormValues = {
  cardholder: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
};

export type PaymentFormErrors = Partial<Record<keyof PaymentFormValues, string>>;

export type PaymentCardFocus = 'name' | 'number' | 'expiry' | 'cvc' | undefined;

export type DeliveryFormValues = {
  recipientName: string;
  phone: string;
  zone: string;
  address: string;
  reference: string;
};

export type DeliveryFormErrors = Partial<Record<keyof DeliveryFormValues, string>>;

export type DeliveryEstimate = {
  zone: string;
  label: string;
  distanceKm: number;
  minutes: number;
  shippingCost: number;
};
