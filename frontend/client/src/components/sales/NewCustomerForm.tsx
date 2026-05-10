import { Input } from '../ui/Input';

type NewCustomerFormState = {
  email: string;
  firstName: string;
  lastName: string;
  nit: string;
};

type NewCustomerFormProps = {
  errorMessage?: string;
  form: NewCustomerFormState;
  isSaving: boolean;
  onChange: (field: keyof NewCustomerFormState, value: string) => void;
  onSubmit: () => void;
};

export function NewCustomerForm({
  errorMessage,
  form,
  isSaving,
  onChange,
  onSubmit,
}: NewCustomerFormProps) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-5">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">
          Cliente nuevo
        </p>
        <h4 className="mt-2 text-lg font-bold text-slate-950">Completa los datos para continuar</h4>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Nombres"
          onChange={(event) => onChange('firstName', event.target.value)}
          placeholder="Ej. Juan"
          value={form.firstName}
        />
        <Input
          label="Apellidos"
          onChange={(event) => onChange('lastName', event.target.value)}
          placeholder="Ej. Pérez López"
          value={form.lastName}
        />
        <Input
          label="NIT"
          onChange={(event) => onChange('nit', event.target.value.toUpperCase())}
          placeholder="1234567-8"
          value={form.nit}
          wrapperClassName="md:col-span-1"
        />
        <Input
          label="Correo"
          onChange={(event) => onChange('email', event.target.value)}
          placeholder="Opcional"
          type="email"
          value={form.email}
        />
      </div>

      <button
        className="mt-5 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSaving}
        onClick={onSubmit}
        type="button"
      >
        {isSaving ? 'Guardando cliente...' : 'Guardar cliente y continuar'}
      </button>
    </div>
  );
}
