import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes, randomUUID } from 'crypto';
import { IUsersRepository } from '../users/users.repository';
import { IEmailService } from '../../shared/services/email.service';
import {
  LoginRequest,
  LoginResponse,
  LoginAttempt,
  AuthTokenPayload,
  PasswordResetToken,
} from './auth.types';
import { AppError } from '../../shared/errors/AppError';
import { env } from '../../config/env';
import { tokenBlacklist } from '../../shared/services/token-blacklist';

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000;
const RESET_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export class AuthService {
  private readonly attempts = new Map<string, LoginAttempt>();
  private readonly resetTokens = new Map<string, PasswordResetToken>();

  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly emailService: IEmailService,
  ) {}

  async login(dto: LoginRequest): Promise<LoginResponse> {
    this.checkIfBlocked(dto.identifier);

    const user = await this.usersRepository.findByIdentifierGlobally(dto.identifier);

    if (user && !user.passwordHash) {
      throw new AppError('Account not yet activated. Use the first access link.', 401, 'FIRST_ACCESS_REQUIRED');
    }

    const passwordMatch =
      user && user.passwordHash ? await bcrypt.compare(dto.password, user.passwordHash) : false;

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

  async logout(token: string): Promise<void> {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    const expiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now() + 30 * 60 * 1000;
    tokenBlacklist.add(token, expiresAt);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersRepository.findByIdentifierGlobally(email);

    if (user) {
      const isFirstAccess = !user.passwordHash;
      const token = randomBytes(32).toString('hex');

      this.resetTokens.set(token, {
        id: randomUUID(),
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
        isFirstAccess,
      });

      await this.emailService.sendPasswordResetLink(email, token, isFirstAccess);
    }

    // No error thrown whether email exists or not — never confirm existence
  }

  async validateResetToken(token: string): Promise<{ isFirstAccess: boolean }> {
    const resetToken = this.resetTokens.get(token);

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired link', 400, 'INVALID_RESET_TOKEN');
    }

    return { isFirstAccess: resetToken.isFirstAccess };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = this.resetTokens.get(token);

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired link', 400, 'INVALID_RESET_TOKEN');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.usersRepository.updatePassword(resetToken.userId, passwordHash);

    // Single use — mark as used immediately after consumption
    resetToken.usedAt = new Date();
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
