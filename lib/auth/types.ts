/**
 * Authentication flow types
 */

export type AuthFlowType = 'signup' | 'login' | 'recovery' | 'invite' | 'email';

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

export interface PasswordResetRequest {
  email: string;
  redirectTo: string;
}

export interface SignUpData {
  email: string;
  password: string;
  businessName: string;
  businessCategory?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface SetPasswordData {
  password: string;
  confirmPassword: string;
}
