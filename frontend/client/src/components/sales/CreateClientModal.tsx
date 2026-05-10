import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

type CreateClientModalProps = {
  errorMessage: string;
  form: {
    fullName: string;
    nit: string;
    phone: string;
    email: string;
  };
  isOpen: boolean;
  isSaving: boolean;
  onChange: (field: 'fullName' | 'nit' | 'phone' | 'email', value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function CreateClientModal({
  errorMessage,
  form,
  isOpen,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}: CreateClientModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      subtitle="Crea un cliente sin salir de caja y selecciónalo automáticamente para la venta."
      title="Nuevo cliente"
    >
      <div className="grid gap-5 px-6 py-6">
        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-4">
          <Input
            label="Nombre completo"
            onChange={(event) => onChange('fullName', event.target.value)}
            placeholder="Ej. Juan Pérez López"
            value={form.fullName}
          />
          <Input
            label="NIT"
            onChange={(event) => onChange('nit', event.target.value.toUpperCase())}
            placeholder="Ej. 1234567-8"
            value={form.nit}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Teléfono"
              onChange={(event) => onChange('phone', event.target.value)}
              placeholder="Opcional"
              value={form.phone}
            />
            <Input
              label="Correo"
              onChange={(event) => onChange('email', event.target.value)}
              placeholder="Opcional"
              type="email"
              value={form.email}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <button
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={onSubmit}
            type="button"
          >
            {isSaving ? 'Guardando...' : 'Guardar cliente'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
