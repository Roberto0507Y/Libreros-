import type { SessionData, SessionUser } from '../domain/types';
import { publicRequest } from './client';

type LoginPayload = {
  message?: string;
  token?: string;
  user?: SessionUser;
};

type AccessRequestPayload = {
  message?: string;
};

type RegisterPayload = {
  message?: string;
};

type ForgotPasswordPayload = {
  message?: string;
};

type ValidateResetPayload = {
  message?: string;
  email?: string;
  username?: string;
};

const hasSessionPayload = (payload: LoginPayload): payload is SessionData & { message?: string } =>
  Boolean(payload.token && payload.user);

export async function login(identifier: string, password: string) {
  const payload = await publicRequest<LoginPayload>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });

  if (!hasSessionPayload(payload)) {
    throw new Error(payload.message ?? 'No fue posible iniciar sesion');
  }

  return {
    token: payload.token,
    user: payload.user,
  } satisfies SessionData;
}

export async function requestAccess(form: {
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  return publicRequest<AccessRequestPayload>('/api/auth/request-access', {
    method: 'POST',
    body: JSON.stringify(form),
  });
}

export async function registerCustomer(form: {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
}) {
  return publicRequest<RegisterPayload>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(form),
  });
}

export async function requestPasswordReset(email: string) {
  return publicRequest<ForgotPasswordPayload>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function validateResetPasswordToken(token: string) {
  const query = new URLSearchParams({ token }).toString();
  return publicRequest<ValidateResetPayload>(`/api/auth/reset-password/validate?${query}`);
}

export async function resetPassword(token: string, password: string) {
  return publicRequest<ForgotPasswordPayload>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}
