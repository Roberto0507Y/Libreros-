import { Banknote, CreditCard, Search, UserRound, WalletCards } from 'lucide-react';

import type { CustomerItem } from '../../domain/types';
import { currency } from '../../lib/format';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { CustomerTypeCard } from './CustomerTypeCard';
import { NewCustomerForm } from './NewCustomerForm';
import { PaymentMethodCard } from './PaymentMethodCard';
import type { PaymentMethod } from './PaymentMethodSelector';

type CheckoutItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

type NewCustomerFormState = {
  email: string;
  firstName: string;
  lastName: string;
  nit: string;
  phone: string;
};

type CheckoutModalProps = {
  amountReceived: string;
  cartItems: CheckoutItem[];
  change: number;
  customerMode: 'cf' | 'nit';
  customerSearch: string;
  customerSearchResults: CustomerItem[];
  discountValue: number;
  errorMessage: string;
  isCreatingCustomer: boolean;
  isOpen: boolean;
  isSearchingCustomers: boolean;
  isSubmitting: boolean;
  newCustomerError: string;
  newCustomerForm: NewCustomerFormState;
  onAmountReceivedChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  onContinueFromCustomer: () => void;
  onCreateCustomer: () => void;
  onCustomerModeChange: (value: 'cf' | 'nit') => void;
  onCustomerSearchChange: (value: string) => void;
  onCustomerSelect: (customer: CustomerItem) => void;
  onNewCustomerChange: (field: keyof NewCustomerFormState, value: string) => void;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onPaymentReferenceChange: (value: string) => void;
  onStepChange: (step: 1 | 2 | 3) => void;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  selectedCustomer: CustomerItem | null;
  step: 1 | 2 | 3;
  subtotal: number;
  total: number;
};

const steps = [
  { id: 1, label: 'Cliente' },
  { id: 2, label: 'Pago' },
  { id: 3, label: 'Confirmación' },
] as const;

export function CheckoutModal({
  amountReceived,
  cartItems,
  change,
  customerMode,
  customerSearch,
  customerSearchResults,
  discountValue,
  errorMessage,
  isCreatingCustomer,
  isOpen,
  isSearchingCustomers,
  isSubmitting,
  newCustomerError,
  newCustomerForm,
  onAmountReceivedChange,
  onClose,
  onConfirm,
  onContinueFromCustomer,
  onCreateCustomer,
  onCustomerModeChange,
  onCustomerSearchChange,
  onCustomerSelect,
  onNewCustomerChange,
  onPaymentMethodChange,
  onPaymentReferenceChange,
  onStepChange,
  paymentMethod,
  paymentReference,
  selectedCustomer,
  step,
  subtotal,
  total,
}: CheckoutModalProps) {
  const selectedNitCustomer =
    customerMode === 'nit' && selectedCustomer?.nit?.toUpperCase() !== 'CF' ? selectedCustomer : null;
  const showNewCustomerForm =
    customerMode === 'nit' &&
    customerSearch.trim().length > 0 &&
    !isSearchingCustomers &&
    !selectedNitCustomer &&
    customerSearchResults.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      subtitle="Completa el cobro en tres pasos rápidos para registrar la venta correctamente."
      title="Finalizar venta presencial"
    >
      <div className="grid gap-6 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-6 py-6 lg:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center gap-3">
            {steps.map((stepItem) => {
              const active = step === stepItem.id;
              const done = step > stepItem.id;

              return (
                <button
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : done
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-500'
                  }`}
                  key={stepItem.id}
                  onClick={() => onStepChange(stepItem.id)}
                  type="button"
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full text-xs ${
                      active
                        ? 'bg-blue-600 text-white'
                        : done
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {stepItem.id}
                  </span>
                  {stepItem.label}
                </button>
              );
            })}
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {step === 1 ? (
            <section className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <CustomerTypeCard
                  active={customerMode === 'cf'}
                  description="Usa el cliente Consumidor Final con NIT CF y continúa de inmediato."
                  icon={WalletCards}
                  label="Consumidor Final / CF"
                  onClick={() => onCustomerModeChange('cf')}
                />
                <CustomerTypeCard
                  active={customerMode === 'nit'}
                  description="Busca al cliente por NIT. Si no existe, créalo rápido sin salir de caja."
                  icon={UserRound}
                  label="Cliente con NIT"
                  onClick={() => onCustomerModeChange('nit')}
                />
              </div>

              {customerMode === 'cf' ? (
                <div className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-600">
                    Cliente seleccionado
                  </p>
                  <strong className="mt-2 block text-xl text-emerald-950">Consumidor Final - NIT CF</strong>
                  <p className="mt-2 text-sm text-emerald-700">
                    La venta se registrará automáticamente con el cliente por defecto.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      onChange={(event) => onCustomerSearchChange(event.target.value)}
                      placeholder="Buscar cliente por NIT..."
                      type="search"
                      value={customerSearch}
                    />
                  </div>

                  {isSearchingCustomers ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Buscando clientes...
                    </div>
                  ) : null}

                  {customerSearchResults.length ? (
                    <div className="grid max-h-[260px] gap-3 overflow-y-auto pr-1">
                      {customerSearchResults.map((customer) => {
                        const active = selectedCustomer?.id === customer.id;

                        return (
                          <button
                            className={`rounded-[22px] border px-4 py-4 text-left transition ${
                              active
                                ? 'border-blue-300 bg-blue-50'
                                : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white'
                            }`}
                            key={customer.id}
                            onClick={() => onCustomerSelect(customer)}
                            type="button"
                          >
                            <strong className="block text-base text-slate-950">{customer.name}</strong>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                              {customer.nit ? <span>NIT: {customer.nit}</span> : null}
                              {customer.telefono ? <span>{customer.telefono}</span> : null}
                              {customer.correo ? <span>{customer.correo}</span> : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {showNewCustomerForm ? (
                    <div className="grid gap-4">
                      <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        No encontramos ese NIT. Puedes crear el cliente aquí mismo y continuar con la venta.
                      </div>
                      <NewCustomerForm
                        errorMessage={newCustomerError}
                        form={newCustomerForm}
                        isSaving={isCreatingCustomer}
                        onChange={onNewCustomerChange}
                        onSubmit={onCreateCustomer}
                      />
                    </div>
                  ) : null}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  onClick={onClose}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  onClick={onContinueFromCustomer}
                  type="button"
                >
                  Continuar al pago
                </button>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <PaymentMethodCard
                  active={paymentMethod === 'efectivo'}
                  description="Recibe dinero en caja y calcula el cambio automáticamente."
                  icon={Banknote}
                  label="Efectivo"
                  onClick={() => onPaymentMethodChange('efectivo')}
                />
                <PaymentMethodCard
                  active={paymentMethod === 'tarjeta'}
                  description="Registra cobro con terminal bancaria o referencia POS."
                  icon={CreditCard}
                  label="Tarjeta"
                  onClick={() => onPaymentMethodChange('tarjeta')}
                />
              </div>

              {paymentMethod === 'efectivo' ? (
                <div className="grid gap-4 rounded-[26px] border border-emerald-200 bg-emerald-50/70 p-5 md:grid-cols-[minmax(0,1fr)_220px]">
                  <Input
                    hint="Debe cubrir el total de la compra."
                    label="Monto recibido"
                    min="0"
                    onChange={(event) => onAmountReceivedChange(event.target.value)}
                    step="0.01"
                    type="number"
                    value={amountReceived}
                  />
                  <div className="rounded-[22px] border border-emerald-200 bg-white px-4 py-4 shadow-sm">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                      Cambio
                    </span>
                    <strong className="mt-2 block text-3xl font-black text-emerald-700">
                      {currency.format(change)}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="rounded-[26px] border border-blue-200 bg-blue-50/70 p-5">
                  <Input
                    hint="Opcional: autorización, voucher o referencia POS."
                    label="Referencia de pago"
                    onChange={(event) => onPaymentReferenceChange(event.target.value)}
                    placeholder="Ej. AUT-5831"
                    type="text"
                    value={paymentReference}
                  />
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  onClick={() => onStepChange(1)}
                  type="button"
                >
                  Volver
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  onClick={() => onStepChange(3)}
                  type="button"
                >
                  Revisar confirmación
                </button>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="grid gap-5">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                <div className="grid gap-4 border-b border-slate-200 pb-4 md:grid-cols-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Cliente</span>
                    <strong className="mt-2 block text-base text-slate-950">
                      {selectedCustomer
                        ? selectedCustomer.nit?.toUpperCase() === 'CF'
                          ? 'Consumidor Final'
                          : selectedCustomer.name
                        : 'Consumidor Final'}
                    </strong>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedCustomer?.nit?.toUpperCase() === 'CF'
                        ? 'NIT CF'
                        : selectedCustomer?.nit
                          ? `NIT ${selectedCustomer.nit}`
                          : 'Sin NIT registrado'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Método de pago
                    </span>
                    <strong className="mt-2 block text-base capitalize text-slate-950">{paymentMethod}</strong>
                    <p className="mt-1 text-sm text-slate-500">
                      {paymentMethod === 'efectivo'
                        ? `Cambio estimado: ${currency.format(change)}`
                        : paymentReference
                          ? `Referencia: ${paymentReference}`
                          : 'Sin referencia registrada'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {cartItems.map((item) => (
                    <div
                      className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
                      key={item.id}
                    >
                      <div>
                        <strong className="block text-sm text-slate-950">{item.name}</strong>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.quantity} × {currency.format(item.price)}
                        </p>
                      </div>
                      <strong className="text-sm text-slate-950">{currency.format(item.subtotal)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 rounded-[28px] bg-slate-950 px-5 py-5 text-white shadow-[0_20px_40px_rgba(15,23,42,0.2)]">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Subtotal</span>
                  <strong className="text-white">{currency.format(subtotal)}</strong>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Descuento</span>
                  <strong className="text-white">{currency.format(discountValue)}</strong>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-base font-semibold text-white">Total</span>
                  <strong className="text-3xl font-black text-emerald-300">{currency.format(total)}</strong>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  onClick={() => onStepChange(2)}
                  type="button"
                >
                  Volver
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#16a34a,#22c55e)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(34,197,94,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  onClick={onConfirm}
                  type="button"
                >
                  {isSubmitting ? 'Confirmando venta...' : 'Confirmar venta'}
                </button>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="grid h-fit gap-4 rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">
              Resumen rápido
            </p>
            <h3 className="mt-2 text-xl font-bold text-slate-950">Orden actual</h3>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[22px] bg-slate-50 px-4 py-4">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Cliente</span>
              <strong className="mt-2 block text-slate-950">
                {selectedCustomer
                  ? selectedCustomer.nit?.toUpperCase() === 'CF'
                    ? 'Consumidor Final - NIT CF'
                    : selectedCustomer.name
                  : 'Consumidor Final - NIT CF'}
              </strong>
            </div>
            <div className="rounded-[22px] bg-slate-50 px-4 py-4">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Artículos</span>
              <strong className="mt-2 block text-slate-950">{cartItems.length}</strong>
            </div>
            <div className="rounded-[22px] bg-slate-950 px-4 py-4 text-white">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Total a cobrar</span>
              <strong className="mt-2 block text-3xl font-black">{currency.format(total)}</strong>
            </div>
          </div>
        </aside>
      </div>
    </Modal>
  );
}
