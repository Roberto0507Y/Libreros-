export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:2000';

type ApiErrorPayload = {
  message?: string;
};

export async function publicRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as T & ApiErrorPayload;

  if (!response.ok) {
    throw new Error(payload.message ?? 'Ocurrio un error en la solicitud');
  }

  return payload;
}

export async function authRequest<T>(path: string, token: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as T & ApiErrorPayload;

  if (!response.ok) {
    throw new Error(payload.message ?? 'Ocurrio un error en la solicitud');
  }

  return payload;
}

