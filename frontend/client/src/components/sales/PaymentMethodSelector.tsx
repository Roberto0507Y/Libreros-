type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

type PaymentMethodSelectorProps = {
  onChange: (method: PaymentMethod) => void;
  value: PaymentMethod;
};

const methods: Array<{ description: string; label: string; value: PaymentMethod }> = [
  {
    label: 'Efectivo',
    value: 'efectivo',
    description: 'Cobro inmediato en caja con calculo de cambio',
  },
  {
    label: 'Tarjeta',
    value: 'tarjeta',
    description: 'Pago procesado con POS o terminal bancaria',
  },
  {
    label: 'Transferencia',
    value: 'transferencia',
    description: 'Pago confirmado mediante transferencia bancaria',
  },
];

export function PaymentMethodSelector({ onChange, value }: PaymentMethodSelectorProps) {
  return (
    <div className="grid gap-3">
      <p className="text-sm font-semibold text-slate-700">Metodo de pago</p>

      <div className="grid gap-3">
        {methods.map((method) => {
          const active = method.value === value;

          return (
            <button
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                active
                  ? 'border-blue-300 bg-blue-50 shadow-[0_10px_24px_rgba(37,99,235,0.12)]'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
              key={method.value}
              onClick={() => onChange(method.value)}
              type="button"
            >
              <strong className="block text-sm text-slate-900">{method.label}</strong>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{method.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type { PaymentMethod };
