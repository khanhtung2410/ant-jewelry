export const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  TOO_MANY_ATTEMPTS: 'Too many sign-in attempts. Please try again later.',
  LOGIN_UNAVAILABLE: 'Sign-in is temporarily unavailable. Please try again later.',
  AUTH_REQUIRED: 'You must be signed in to continue.',
} as const;

export type AuthMessageKey = keyof typeof AUTH_MESSAGES;
