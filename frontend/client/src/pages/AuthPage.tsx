import { useState, type ChangeEvent, type FormEvent } from 'react';

import type { SessionData } from '../domain/types';
import { LockIcon, UserIcon } from '../components/icons';
import { login, registerCustomer, requestAccess } from '../api/auth';
import { storeSession } from '../lib/session';

type AuthPageProps = {
  onLogin: (session: SessionData) => void;
};

export function AuthPage({ onLogin }: AuthPageProps) {
  const [form, setForm] = useState({
    identifier: '',
    password: '',
    rememberMe: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [accessForm, setAccessForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [accessError, setAccessError] = useState('');
  const [accessMessage, setAccessMessage] = useState('');
  const [isSendingAccess, setIsSendingAccess] = useState(false);

  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    phone: '',
  });
  const [registerError, setRegisterError] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLoginChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAccessChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setAccessForm((current) => ({ ...current, [name]: value }));
  };

  const handleRegisterChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setRegisterForm((current) => ({ ...current, [name]: value }));
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const session = await login(form.identifier, form.password);
      storeSession(session, form.rememberMe);
      onLogin(session);
      setForm((current) => ({ ...current, identifier: '', password: '' }));
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No fue posible iniciar sesion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccessSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccessError('');
    setAccessMessage('');
    setIsSendingAccess(true);

    try {
      const payload = await requestAccess(accessForm);
      setAccessMessage(payload.message ?? 'Solicitud enviada');
      setAccessForm({ name: '', email: '', phone: '', message: '' });
    } catch (requestError) {
      setAccessError(
        requestError instanceof Error ? requestError.message : 'No se pudo enviar la solicitud',
      );
    } finally {
      setIsSendingAccess(false);
    }
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterError('');
    setRegisterMessage('');
    setIsRegistering(true);

    try {
      const payload = await registerCustomer(registerForm);
      setRegisterMessage(payload.message ?? 'Cuenta creada');
      setRegisterForm({
        fullName: '',
        username: '',
        email: '',
        password: '',
        phone: '',
      });
    } catch (registerErrorValue) {
      setRegisterError(
        registerErrorValue instanceof Error
          ? registerErrorValue.message
          : 'No se pudo crear la cuenta',
      );
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card" role="main">
        <section className="auth-left">
          <div className="auth-brand">
            <div className="auth-logo">PL</div>
            <div>
              <p className="auth-brand-name">LIBREROS</p>
              <span className="auth-brand-caption">Inventario, ventas y productos</span>
            </div>
          </div>

          <div className="auth-left-copy">
            <strong>Sistema de libreria</strong>
            <p>Accede para gestionar existencias, crear productos y registrar ventas.</p>
            <div className="auth-left-badges">
              <span>Stock</span>
              <span>Ventas</span>
              <span>Catalogo</span>
            </div>
          </div>
        </section>

        <section className="auth-right">
          <header className="auth-header">
            <h1>Accede a tu Panel</h1>
            <p>Gestion de Inventario y Productos</p>
          </header>

          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <label className="auth-field">
              <span>Usuario</span>
              <div className="auth-input">
                <UserIcon />
                <input
                  autoComplete="username"
                  name="identifier"
                  onChange={handleLoginChange}
                  placeholder="Usuario o correo"
                  required
                  type="text"
                  value={form.identifier}
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Contrasena</span>
              <div className="auth-input">
                <LockIcon />
                <input
                  autoComplete="current-password"
                  name="password"
                  onChange={handleLoginChange}
                  placeholder="Contrasena"
                  required
                  type="password"
                  value={form.password}
                />
              </div>
            </label>

            <div className="auth-row">
              <label className="custom-checkbox">
                <input
                  checked={form.rememberMe}
                  name="rememberMe"
                  onChange={handleLoginChange}
                  type="checkbox"
                />
                <span>Recuerdame</span>
              </label>
              <button className="auth-link" type="button">
                ¿Olvidaste tu contrasena?
              </button>
            </div>

            {error ? <p className="error-message">{error}</p> : null}

            <button className="primary-button full-width-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'VALIDANDO...' : 'INICIAR SESION'}
            </button>

            <p className="auth-footnote">
              No tienes cuenta?{' '}
              <button
                className="auth-link strong"
                onClick={() => {
                  setIsRegisterOpen(true);
                  setRegisterError('');
                  setRegisterMessage('');
                }}
                type="button"
              >
                Crear cuenta
              </button>
            </p>

            <p className="auth-footnote subtle">
              ¿Necesitas acceso interno?{' '}
              <button
                className="auth-link strong"
                onClick={() => {
                  setIsAccessOpen(true);
                  setAccessError('');
                  setAccessMessage('');
                }}
                type="button"
              >
                Solicita acceso administrativo
              </button>
            </p>

            <p className="auth-footnote subtle">Soporte tecnico</p>
            <p className="auth-footnote subtle">Usuario demo: admin / Admin123!</p>
          </form>

          {isRegisterOpen ? (
            <div className="auth-modal" role="dialog" aria-modal="true">
              <div className="auth-modal-card">
                <div className="auth-modal-head">
                  <div>
                    <strong>Crear cuenta de cliente</strong>
                    <span>Esta cuenta podra iniciar sesion y comprar en linea</span>
                  </div>
                  <button
                    className="auth-close"
                    onClick={() => setIsRegisterOpen(false)}
                    type="button"
                  >
                    Cerrar
                  </button>
                </div>

                <form className="auth-form" onSubmit={handleRegisterSubmit}>
                  <label className="auth-field">
                    <span>Nombre completo</span>
                    <div className="auth-input">
                      <UserIcon />
                      <input
                        name="fullName"
                        onChange={handleRegisterChange}
                        placeholder="Tu nombre completo"
                        required
                        type="text"
                        value={registerForm.fullName}
                      />
                    </div>
                  </label>

                  <label className="auth-field">
                    <span>Usuario</span>
                    <div className="auth-input">
                      <UserIcon />
                      <input
                        name="username"
                        onChange={handleRegisterChange}
                        placeholder="Usuario para iniciar sesion"
                        required
                        type="text"
                        value={registerForm.username}
                      />
                    </div>
                  </label>

                  <label className="auth-field">
                    <span>Correo</span>
                    <div className="auth-input">
                      <UserIcon />
                      <input
                        name="email"
                        onChange={handleRegisterChange}
                        placeholder="correo@ejemplo.com"
                        required
                        type="email"
                        value={registerForm.email}
                      />
                    </div>
                  </label>

                  <label className="auth-field">
                    <span>Contrasena</span>
                    <div className="auth-input">
                      <LockIcon />
                      <input
                        name="password"
                        onChange={handleRegisterChange}
                        placeholder="Minimo 6 caracteres"
                        required
                        type="password"
                        value={registerForm.password}
                      />
                    </div>
                  </label>

                  <label className="auth-field">
                    <span>Telefono (opcional)</span>
                    <div className="auth-input">
                      <UserIcon />
                      <input
                        name="phone"
                        onChange={handleRegisterChange}
                        placeholder="0000-0000"
                        type="text"
                        value={registerForm.phone}
                      />
                    </div>
                  </label>

                  {registerError ? <p className="error-message">{registerError}</p> : null}
                  {registerMessage ? <p className="success-message">{registerMessage}</p> : null}

                  <button
                    className="primary-button full-width-button"
                    disabled={isRegistering}
                    type="submit"
                  >
                    {isRegistering ? 'CREANDO...' : 'CREAR CUENTA'}
                  </button>
                </form>
              </div>
            </div>
          ) : null}

          {isAccessOpen ? (
            <div className="auth-modal" role="dialog" aria-modal="true">
              <div className="auth-modal-card">
                <div className="auth-modal-head">
                  <div>
                    <strong>Solicitar acceso</strong>
                    <span>Se guardara tu solicitud para aprobacion</span>
                  </div>
                  <button className="auth-close" onClick={() => setIsAccessOpen(false)} type="button">
                    Cerrar
                  </button>
                </div>

                <form className="auth-form" onSubmit={handleAccessSubmit}>
                  <label className="auth-field">
                    <span>Nombre</span>
                    <div className="auth-input">
                      <UserIcon />
                      <input
                        name="name"
                        onChange={handleAccessChange}
                        placeholder="Tu nombre"
                        required
                        type="text"
                        value={accessForm.name}
                      />
                    </div>
                  </label>

                  <label className="auth-field">
                    <span>Correo</span>
                    <div className="auth-input">
                      <UserIcon />
                      <input
                        name="email"
                        onChange={handleAccessChange}
                        placeholder="correo@ejemplo.com"
                        required
                        type="email"
                        value={accessForm.email}
                      />
                    </div>
                  </label>

                  <label className="auth-field">
                    <span>Telefono (opcional)</span>
                    <div className="auth-input">
                      <UserIcon />
                      <input
                        name="phone"
                        onChange={handleAccessChange}
                        placeholder="0000-0000"
                        type="text"
                        value={accessForm.phone}
                      />
                    </div>
                  </label>

                  <label className="auth-field">
                    <span>Mensaje (opcional)</span>
                    <textarea
                      name="message"
                      onChange={handleAccessChange}
                      placeholder="Cuenta para: ventas / bodega / administrador..."
                      rows={3}
                      value={accessForm.message}
                    />
                  </label>

                  {accessError ? <p className="error-message">{accessError}</p> : null}
                  {accessMessage ? <p className="success-message">{accessMessage}</p> : null}

                  <button className="primary-button full-width-button" disabled={isSendingAccess} type="submit">
                    {isSendingAccess ? 'ENVIANDO...' : 'ENVIAR SOLICITUD'}
                  </button>
                </form>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
