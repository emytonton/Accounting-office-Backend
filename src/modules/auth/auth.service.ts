import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUsersRepository } from '../users/users.repository';
import { LoginRequest, LoginResponse, LoginAttempt, AuthTokenPayload } from './auth.types';
import { AppError } from '../../shared/errors/AppError';
import { env } from '../../config/env';

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

export class AuthService {
  private readonly attempts = new Map<string, LoginAttempt>();

  constructor(private readonly usersRepository: IUsersRepository) {}

  async login(dto: LoginRequest): Promise<LoginResponse> {
    this.checkIfBlocked(dto.identifier);

    const user = await this.usersRepository.findByIdentifierGlobally(dto.identifier);

    const passwordMatch = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;

    // Same error for "user not found" and "wrong password" — never reveal which
    if (!user || !passwordMatch) {
      this.recordFailedAttempt(dto.identifier);
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }

    this.clearAttempts(dto.identifier);

    const payload: AuthTokenPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      sector: user.sector,
    };

    const token = jwt.sign(payload, env.JWT_SECRET || 'dev_secret', {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    return {
      token,
      expiresIn: env.JWT_EXPIRES_IN,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        sector: user.sector,
        tenantId: user.tenantId,
      },
    };
  }

  private checkIfBlocked(identifier: string): void {
    const attempt = this.attempts.get(identifier);
    if (attempt?.blockedUntil && attempt.blockedUntil > new Date()) {
      throw new AppError('Too many failed attempts. Try again later.', 429, 'TOO_MANY_ATTEMPTS');
    }
  }

  private recordFailedAttempt(identifier: string): void {
    const existing = this.attempts.get(identifier) ?? {
      count: 0,
      lastAttemptAt: new Date(),
    };

    existing.count += 1;
    existing.lastAttemptAt = new Date();

    if (existing.count >= MAX_ATTEMPTS) {
      existing.blockedUntil = new Date(Date.now() + BLOCK_DURATION_MS);
    }

    this.attempts.set(identifier, existing);
  }

  private clearAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }
}
