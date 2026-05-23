import axios, { AxiosError, type AxiosRequestConfig, type Method } from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:2000').replace(/\/+$/, '');

const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT ?? 15000);

type ApiErrorPayload = {
  message?: string;
};

const api = axios.create({
  baseURL: API_URL,
  timeout: Number.isFinite(API_TIMEOUT) ? API_TIMEOUT : 15000,
  headers: {
    Accept: 'application/json',
  },
});

const normalizeHeaders = (headers?: HeadersInit) => {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
};

const parseRequestBody = (body?: BodyInit | null) => {
  if (body == null) {
    return undefined;
  }

  if (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  ) {
    return body;
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  return body;
};

const buildRequestConfig = (
  path: string,
  init?: RequestInit,
  token?: string,
): AxiosRequestConfig => {
  const headers = {
    ...normalizeHeaders(init?.headers),
  } as Record<string, string>;

  const data = parseRequestBody(init?.body);

  if (!('Content-Type' in headers) && !('content-type' in headers) && !(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return {
    url: path,
    method: (init?.method as Method | undefined) ?? 'GET',
    data,
    headers,
    signal: init?.signal ?? undefined,
  };
};

const resolveErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const axiosError = error as AxiosError<ApiErrorPayload>;
    return (
      axiosError.response?.data?.message ??
      axiosError.message ??
      'Ocurrio un error en la solicitud'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ocurrio un error en la solicitud';
};

async function request<T>(config: AxiosRequestConfig) {
  try {
    const response = await api.request<T>(config);
    return response.data;
  } catch (error) {
    throw new Error(resolveErrorMessage(error));
  }
}

export async function publicRequest<T>(path: string, init?: RequestInit) {
  return request<T>(buildRequestConfig(path, init));
}

export async function authRequest<T>(path: string, token: string, init?: RequestInit) {
  return request<T>(buildRequestConfig(path, init, token));
}
