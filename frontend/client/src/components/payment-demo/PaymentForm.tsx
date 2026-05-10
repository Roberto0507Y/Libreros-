import type { ChangeEvent, ReactNode } from 'react';

import { SecurityFeatures, SecurityNotice } from './SecurityNotice';
import type { PaymentCardFocus, PaymentFormErrors, PaymentFormValues } from './types';

type PaymentFormProps = {
  errors: PaymentFormErrors;
  feedbackMessage?: string;
  feedbackTone?: 'error' | 'success';
  isCheckingOut: boolean;
  onBack: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onConfirm: () => void;
  onFieldFocus: (field: PaymentCardFocus) => void;
  onSelectStep?: (step: 'delivery' | 'payment' | 'confirmation') => void;
  values: PaymentFormValues;
};

function inputTone(hasError: boolean) {
  return hasError
    ? 'border-rose-300 bg-rose-50 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-100'
    : 'border-slate-200 bg-slate-50 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100';
}

function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center text-slate-400">
      {children}
    </span>
  );
}

export function PaymentForm({
  errors,
  feedbackMessage,
  feedbackTone = 'error',
  isCheckingOut,
  onBack,
  onChange,
  onClose,
  onConfirm,
  onFieldFocus,
  onSelectStep,
  values,
}: PaymentFormProps) {
  return (
    <div className="order-1 px-7 py-7 md:px-10 md:py-9 lg:px-12 lg:py-10">
      <div className="mx-auto w-full max-w-[690px]">
        <div className="mb-8 flex items-center gap-4 text-slate-400">
          <CheckoutStep
            isClickable
            isDone
            label="Entrega"
            number="1"
            onClick={() => (onSelectStep ? onSelectStep('delivery') : onBack())}
          />
          <div className="h-px flex-1 bg-slate-200" />
          <CheckoutStep isActive label="Pago" number="2" />
          <div className="h-px flex-1 bg-slate-200" />
          <CheckoutStep label="Confirmación" number="3" />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-[64px] w-[64px] place-items-center rounded-full bg-[linear-gradient(180deg,#eaf2ff,#dbeafe)] text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <svg aria-hidden="true" className="h-7 w-7" viewBox="0 0 24 24" fill="none">
                <rect x="3.5" y="5.5" width="17" height="13" rx="3" stroke="currentColor" strokeWidth="1.8" />
                <path d="M3.5 10h17" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 14.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">
                Pago
              </span>
              <h3 className="mt-3 text-[32px] font-bold tracking-tight text-slate-950">Datos de la tarjeta</h3>
              <p className="mt-2 max-w-md text-base leading-7 text-slate-500">
                Completa la información de la tarjeta para continuar con la autorización del pago.
              </p>
            </div>
          </div>

          <button
            className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-2xl text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="mt-10 grid gap-6">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Nombre del titular</span>
            <div className={`flex h-[60px] items-center rounded-[18px] border ${inputTone(Boolean(errors.cardholder))}`}>
              <FieldIcon>
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.01-8 4.5V20h16v-1.5c0-2.49-3.58-4.5-8-4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </FieldIcon>
              <input
                className="h-full flex-1 rounded-r-[18px] bg-transparent pr-4 text-[17px] text-slate-800 outline-none"
                name="cardholder"
                onChange={onChange}
                onFocus={() => onFieldFocus('name')}
                placeholder="Ej. Juan Pérez"
                type="text"
                value={values.cardholder}
              />
            </div>
            {errors.cardholder ? <span className="text-xs font-medium text-rose-600">{errors.cardholder}</span> : null}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Número de tarjeta</span>
            <div className={`flex h-[60px] items-center rounded-[18px] border ${inputTone(Boolean(errors.cardNumber))}`}>
              <FieldIcon>
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <rect x="3.5" y="5.5" width="17" height="13" rx="3" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M3.5 10h17" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </FieldIcon>
              <input
                className="h-full flex-1 rounded-r-[18px] bg-transparent pr-4 text-[17px] tracking-[0.12em] text-slate-800 outline-none"
                inputMode="numeric"
                name="cardNumber"
                onChange={onChange}
                onFocus={() => onFieldFocus('number')}
                placeholder="1234 1234 1234 1234"
                type="text"
                value={values.cardNumber}
              />
            </div>
            {errors.cardNumber ? (
              <span className="text-xs font-medium text-rose-600">{errors.cardNumber}</span>
            ) : (
              <span className="text-xs font-medium text-slate-500">Ingresa 16 dígitos</span>
            )}
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Fecha de expiración</span>
              <div className={`flex h-[60px] items-center rounded-[18px] border ${inputTone(Boolean(errors.expiry))}`}>
                <FieldIcon>
                  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M8 3.5v3M16 3.5v3M4 9.5h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </FieldIcon>
                <input
                  className="h-full flex-1 rounded-r-[18px] bg-transparent pr-4 text-[17px] text-slate-800 outline-none"
                  inputMode="numeric"
                  name="expiry"
                  onChange={onChange}
                  onFocus={() => onFieldFocus('expiry')}
                  placeholder="MM/AA"
                  type="text"
                  value={values.expiry}
                />
              </div>
              {errors.expiry ? <span className="text-xs font-medium text-rose-600">{errors.expiry}</span> : null}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">CVV</span>
              <div className={`flex h-[60px] items-center rounded-[18px] border ${inputTone(Boolean(errors.cvv))}`}>
                <FieldIcon>
                  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <path d="M17.25 9H16.5V7.5a4.5 4.5 0 0 0-9 0V9h-.75A2.25 2.25 0 0 0 4.5 11.25v8.25a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-8.25A2.25 2.25 0 0 0 17.25 9ZM9 7.5a3 3 0 0 1 6 0V9H9V7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </FieldIcon>
                <input
                  className="h-full flex-1 rounded-r-[18px] bg-transparent pr-4 text-[17px] tracking-[0.18em] text-slate-800 outline-none"
                  inputMode="numeric"
                  name="cvv"
                  onChange={onChange}
                  onFocus={() => onFieldFocus('cvc')}
                  placeholder="123"
                  type="password"
                  value={values.cvv}
                />
              </div>
              {errors.cvv ? (
                <span className="text-xs font-medium text-rose-600">{errors.cvv}</span>
              ) : (
                <span className="text-xs font-medium text-slate-500">3 o 4 dígitos</span>
              )}
            </label>
          </div>

          <SecurityNotice />
          <SecurityFeatures />

          <div className="grid gap-4 pt-4 sm:grid-cols-2">
            <button
              className="h-[62px] rounded-[18px] border border-slate-200 bg-white px-5 text-base font-semibold text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-slate-50"
              onClick={onBack}
              type="button"
            >
              ← Volver al carrito
            </button>
            <button
              className="h-[62px] rounded-[18px] bg-[linear-gradient(135deg,#2563eb,#155dfc)] px-5 text-base font-semibold text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(37,99,235,0.34)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isCheckingOut}
              onClick={onConfirm}
              type="button"
            >
              {isCheckingOut ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Confirmando...
                </span>
              ) : (
                '🔒 Confirmar pago'
              )}
            </button>
          </div>

          {feedbackMessage ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                feedbackTone === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {feedbackMessage}
            </div>
          ) : null}

          <div className="pt-3 text-center text-sm text-slate-500">
            Pago seguro SSL · Tus datos están protegidos
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutStep({
  isActive = false,
  isDone = false,
  isClickable = false,
  label,
  number,
  onClick,
}: {
  isActive?: boolean;
  isDone?: boolean;
  isClickable?: boolean;
  label: string;
  number: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span
        className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold transition ${
          isDone
            ? 'bg-blue-600 text-white'
            : isActive
              ? 'bg-blue-600 text-white'
              : 'border border-slate-300 bg-white text-slate-500'
        }`}
      >
        {isDone ? '✓' : number}
      </span>
      <span className="font-medium">{label}</span>
    </>
  );

  if (isClickable && onClick) {
    return (
      <button
        className={`flex items-center gap-3 text-lg transition hover:text-slate-700 ${
          isActive || isDone ? 'text-slate-800' : 'text-slate-400'
        }`}
        onClick={onClick}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-3 text-lg ${isActive || isDone ? 'text-slate-800' : 'text-slate-400'}`}>
      {content}
    </div>
  );
}
