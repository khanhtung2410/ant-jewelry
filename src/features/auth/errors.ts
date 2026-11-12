import { AUTH_MESSAGES } from './messages';

export type AuthActionState = {
  error?: string;
};

export function authErrorState(message: string): AuthActionState {
  return { error: message };
}

export function invalidCredentialsState(): AuthActionState {
  return authErrorState(AUTH_MESSAGES.INVALID_CREDENTIALS);
}

export function loginUnavailableState(): AuthActionState {
  return authErrorState(AUTH_MESSAGES.LOGIN_UNAVAILABLE);
}

export function handleAuthActionError(context: string, error: unknown): AuthActionState {
  console.error(context, error);
  return loginUnavailableState();
}
