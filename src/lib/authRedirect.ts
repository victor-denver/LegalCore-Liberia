/** Remembers where the user was heading before an OAuth / magic-link round-trip. */
export const CALLBACK_PATH = '/auth/callback';
const NEXT_KEY = 'legalcore-auth-next';

export function callbackUrl() {
  return `${window.location.origin}${CALLBACK_PATH}`;
}

export function rememberNext(path?: string) {
  if (path && path.startsWith('/') && !path.startsWith(CALLBACK_PATH)) sessionStorage.setItem(NEXT_KEY, path);
}

export function consumeNext(): string {
  const v = sessionStorage.getItem(NEXT_KEY) || '/';
  sessionStorage.removeItem(NEXT_KEY);
  return v;
}
