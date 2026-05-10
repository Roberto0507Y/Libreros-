import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, KeyRound, LoaderCircle, Mail } from 'lucide-react';

import { resetPassword, validateResetPasswordToken } from '../api/auth';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

type ResetPasswordPageProps = {
  token: string;
  onBackToStore: () => void;
  onOpenLogin: () => void;
};

export function ResetPasswordPage({
  onBackToStore,
  onOpenLogin,
  token,
}: ResetPasswordPageProps) {
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      setIsCheckingToken(true);
      setError('');

      try {
        const payload = await validateResetPasswordToken(token);

        if (ignore) {
          return;
        }

        setValidationMessage(payload.message ?? '');
        setEmail(payload.email ?? '');
        setUsername(payload.username ?? '');
      } catch (validationError) {
        if (!ignore) {
          setError(
            validationError instanceof Error
              ? validationError.message
              : 'No fue posible validar el enlace.',
          );
        }
      } finally {
        if (!ignore) {
          setIsCheckingToken(false);
        }
      }
    };

    void run();

    return () => {
      ignore = true;
    };
  }, [token]);

  const passwordChecks = useMemo(
    () => ({
      minLength: form.password.length >= 6,
      confirmMatch: form.password.length > 0 && form.password === form.confirmPassword,
    }),
    [form.confirmPassword, form.password],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = await resetPassword(token, form.password);
      setSuccessMessage(payload.message ?? 'Tu contraseña fue actualizada correctamente.');
      setForm({
        password: '',
        confirmPassword: '',
      });
      window.setTimeout(() => {
        onOpenLogin();
      }, 1200);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No fue posible restablecer tu contraseña.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#dff1ff_0%,#eef4fb_34%,#e9f2ff_70%,#eff5fc_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[520px] bg-[linear-gradient(180deg,rgba(30,64,175,0.16),transparent_75%)]" />
      <div className="pointer-events-none absolute -left-24 top-24 z-0 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-80px] top-16 z-0 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 md:px-6">
        <div className="grid w-full gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="rounded-[38px] border border-white/75 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(37,99,235,0.92),rgba(15,23,42,0.98))] px-7 py-8 text-white shadow-[0_35px_110px_rgba(15,23,42,0.26)] md:px-10 md:py-10">
            <button
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/14"
              onClick={onBackToStore}
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a la tienda
            </button>

            <Badge className="mt-8 w-fit border-white/20 bg-white/10 text-white" tone="neutral">
              Acceso seguro
            </Badge>

            <h1 className="mt-5 text-4xl font-black tracking-[-0.06em] text-white md:text-5xl">
              Restablece tu contraseña
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/78 md:text-base">
              Crea una nueva contraseña para recuperar el acceso a tu cuenta. El enlace es de un solo uso y está protegido.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/10 px-5 py-5 backdrop-blur">
                <Mail className="h-6 w-6 text-cyan-200" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                  Correo de la cuenta
                </p>
                <p className="mt-2 text-base font-semibold text-white">
                  {email || 'Validando...'}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/10 px-5 py-5 backdrop-blur">
                <KeyRound className="h-6 w-6 text-emerald-200" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                  Usuario
                </p>
                <p className="mt-2 text-base font-semibold text-white">
                  {username ? `@${username}` : 'Cuenta protegida'}
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/10 px-6 py-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/12">
                  <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                </div>
                <div>
                  <p className="font-semibold text-white">Enlace protegido</p>
                  <p className="text-sm text-white/72">
                    Solo necesitas definir tu nueva contraseña para continuar.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-[38px] border border-white/75 bg-white/96 px-6 py-8 shadow-[0_30px_90px_rgba(15,23,42,0.14)] md:px-8 md:py-9">
            {isCheckingToken ? (
              <div className="grid min-h-[480px] place-items-center text-center">
                <div>
                  <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                  <p className="mt-4 text-sm font-medium text-slate-500">
                    Validando el enlace de restablecimiento...
                  </p>
                </div>
              </div>
            ) : error && !validationMessage && !successMessage ? (
              <div className="grid min-h-[480px] place-items-center text-center">
                <div className="max-w-md">
                  <div className="mx-auto grid h-18 w-18 place-items-center rounded-full bg-rose-50 text-rose-500">
                    <KeyRound className="h-8 w-8" />
                  </div>
                  <h2 className="mt-6 text-3xl font-bold tracking-[-0.04em] text-slate-950">
                    Enlace no disponible
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-500">{error}</p>
                  <div className="mt-7 flex flex-wrap justify-center gap-3">
                    <Button onClick={onOpenLogin} variant="primary">
                      Ir al inicio de sesión
                    </Button>
                    <Button onClick={onBackToStore} variant="secondary">
                      Volver a la tienda
                    </Button>
                  </div>
                </div>
              </div>
            ) : successMessage ? (
              <div className="grid min-h-[480px] place-items-center text-center">
                <div className="max-w-md">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[radial-gradient(circle_at_top,#86efac,#22c55e_58%,#15803d_100%)] shadow-[0_18px_35px_rgba(34,197,94,0.28)]">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="mt-6 text-3xl font-bold tracking-[-0.04em] text-slate-950">
                    Contraseña actualizada
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-500">{successMessage}</p>
                  <div className="mt-7">
                    <Button onClick={onOpenLogin} variant="primary">
                      Iniciar sesión
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <Badge tone="primary">Nueva contraseña</Badge>
                  <h2 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-950">
                    Crea una contraseña segura
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {validationMessage || 'Define una nueva contraseña para recuperar tu acceso.'}
                  </p>
                </div>

                <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
                  <Input
                    label="Nueva contraseña"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, password: event.target.value }))
                    }
                    placeholder="Mínimo 6 caracteres"
                    type="password"
                    value={form.password}
                  />
                  <Input
                    label="Confirmar contraseña"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, confirmPassword: event.target.value }))
                    }
                    placeholder="Repite la contraseña"
                    type="password"
                    value={form.confirmPassword}
                  />

                  <div className="grid gap-3 rounded-[26px] border border-slate-200 bg-slate-50 px-5 py-5">
                    <p className="text-sm font-semibold text-slate-700">Requisitos básicos</p>
                    <div className="grid gap-2 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            passwordChecks.minLength ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        Al menos 6 caracteres
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            passwordChecks.confirmMatch ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        Confirmación idéntica
                      </div>
                    </div>
                  </div>

                  {error ? (
                    <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-600">
                      {error}
                    </div>
                  ) : null}

                  <div className="mt-1 flex flex-wrap gap-3">
                    <Button className="min-w-[220px]" disabled={isSubmitting} type="submit" variant="primary">
                      {isSubmitting ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Restablecer contraseña'
                      )}
                    </Button>
                    <Button onClick={onOpenLogin} type="button" variant="secondary">
                      Volver al inicio de sesión
                    </Button>
                  </div>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
