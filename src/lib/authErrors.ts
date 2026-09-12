/**
 * Turns Supabase auth errors into something a non-lawyer, non-developer can act on.
 *
 * The raw strings are written for whoever is reading the logs, not for the market
 * seller trying to sign up: "email rate limit exceeded" names a quota she has no
 * idea exists and cannot do anything about. Each message below says what happened
 * and what to do next, and nothing about whether an address is registered.
 */

type LooseAuthError = { message?: string; code?: string; status?: number };

export function authErrorMessage(err: LooseAuthError | null | undefined): string {
  if (!err) return 'Something went wrong. Please try again.';

  const code = err.code ?? '';
  const msg = err.message ?? '';
  const has = (re: RegExp) => re.test(msg);

  // Our own project's email quota, not anything the user did. Worth naming the
  // password route because an account created before the throttle still works.
  if (code === 'over_email_send_rate_limit' || has(/email rate limit|rate limit exceeded/i)) {
    return 'Too many emails have been sent from this site in the last hour. Please wait, then try again — if you already set a password, you can sign in with it now.';
  }

  // Supabase enforces a short cooldown between repeat sends and reports the exact
  // number of seconds, which is genuinely useful, so keep it.
  if (has(/only request this after (\d+) seconds?/i)) {
    const secs = msg.match(/after (\d+) seconds?/i)?.[1];
    return `Please wait ${secs ?? 'a few'} seconds before asking for another email.`;
  }

  if (code === 'over_request_rate_limit' || err.status === 429) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (code === 'email_not_confirmed' || has(/email not confirmed/i)) {
    return 'Your account exists, but the email address has not been confirmed yet. Open the confirmation link we sent you, or ask for a new one.';
  }

  if (code === 'email_address_invalid' || has(/unable to validate email|invalid format/i)) {
    return 'That email address does not look right. Please check it and try again.';
  }

  if (code === 'weak_password' || has(/password.*(at least|too short|weak)/i)) {
    return 'Please choose a longer password — at least 8 characters.';
  }

  // Deliberately vague: confirming an address is registered is an account-enumeration
  // leak, so this says the same thing whether or not the account exists.
  if (code === 'user_already_exists' || has(/already registered|already exists/i)) {
    return 'Could not create the account. If you already have one, sign in instead.';
  }

  if (has(/failed to fetch|network|offline/i)) {
    return 'Could not reach the server. Check your connection and try again.';
  }

  // Unmapped: show the original rather than swallowing it, so a real fault is still
  // diagnosable from a screenshot instead of hiding behind "something went wrong".
  return msg || 'Something went wrong. Please try again.';
}
