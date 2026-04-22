export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: string;
  user: {
    id: string;
    name: string;
    role: string;
    sector?: string;
    tenantId: string;
  };
}

export interface AuthTokenPayload {
  userId: string;
  tenantId: string;
  role: 'admin' | 'collaborator';
  sector?: string;
}

export interface LoginAttempt {
  count: number;
  lastAttemptAt: Date;
  blockedUntil?: Date;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  isFirstAccess: boolean;
}
