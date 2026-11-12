export const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  LOGIN_UNAVAILABLE: 'Sign-in is temporarily unavailable. Please try again later.',
  AUTH_REQUIRED: 'You must be signed in to continue.',
} as const;

export type AuthMessageKey = keyof typeof AUTH_MESSAGES;
