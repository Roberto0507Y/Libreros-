import type { SessionData } from '../domain/types';

export const storageKey = 'libreria-session';

export const readStoredSession = () => {
  const storedSession =
    window.localStorage.getItem(storageKey) ?? window.sessionStorage.getItem(storageKey);

  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(storedSession) as SessionData;
  } catch {
    window.localStorage.removeItem(storageKey);
    window.sessionStorage.removeItem(storageKey);
    return null;
  }
};

export const storeSession = (session: SessionData, rememberMe: boolean) => {
  window.localStorage.removeItem(storageKey);
  window.sessionStorage.removeItem(storageKey);

  const targetStorage = rememberMe ? window.localStorage : window.sessionStorage;
  targetStorage.setItem(storageKey, JSON.stringify(session));
};

export const clearStoredSession = () => {
  window.localStorage.removeItem(storageKey);
  window.sessionStorage.removeItem(storageKey);
};

