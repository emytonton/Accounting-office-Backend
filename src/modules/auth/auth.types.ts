export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: string;
}

export interface AuthTokenPayload {
  userId: string;
  tenantId: string;
  role: 'admin' | 'collaborator';
  sector?: string;
}
