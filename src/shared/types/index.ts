export type UserRole = 'admin' | 'collaborator';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  role: UserRole;
  sector?: string;
}

export {};
