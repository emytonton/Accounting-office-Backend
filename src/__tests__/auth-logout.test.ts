import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app';

const TENANT_ID = '123e4567-e89b-12d3-a456-426614174002';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const testUser = {
  tenantId: TENANT_ID,
  name: 'Logout Test User',
  identifier: 'logout.testuser',
  password: 'senha1234',
  role: 'admin',
};

beforeAll(async () => {
  await request(app).post('/users').send(testUser);
});

async function loginAndGetToken(): Promise<string> {
  const res = await request(app)
    .post('/auth/login')
    .send({ identifier: testUser.identifier, password: testUser.password });
  return res.body.data.token as string;
}

describe('UC-A02 — Logout / Session Invalidation', () => {
  describe('POST /auth/logout', () => {
    it('should return 401 without a token', async () => {
      const res = await request(app).post('/auth/logout');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should logout successfully with a valid token', async () => {
      const token = await loginAndGetToken();
      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');
    });

    it('should reject the same token immediately after logout (TOKEN_INVALIDATED)', async () => {
      const token = await loginAndGetToken();

      await request(app).post('/auth/logout').set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_INVALIDATED');
    });

    it('should return 401 with an invalid token', async () => {
      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer token.invalido.qualquer');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('RNF-002 — Sliding window refresh', () => {
    it('should issue X-Refresh-Token when token is past the midpoint of its lifetime', async () => {
      // Token de 30 min com iat 20 min atrás → já passou da metade (15 min).
      const nowSec = Math.floor(Date.now() / 1000);
      const pastMidpointToken = jwt.sign(
        {
          userId: 'user-id',
          tenantId: TENANT_ID,
          role: 'admin',
          iat: nowSec - 20 * 60,
          exp: nowSec + 10 * 60,
        },
        JWT_SECRET,
      );

      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${pastMidpointToken}`);

      expect(res.headers['x-refresh-token']).toBeDefined();
    });

    it('should not issue X-Refresh-Token when token is still in the first half of its lifetime', async () => {
      // Token recém-emitido (30 min) → ainda na primeira metade.
      const freshToken = jwt.sign(
        { userId: 'user-id', tenantId: TENANT_ID, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '30m' },
      );

      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${freshToken}`);

      expect(res.headers['x-refresh-token']).toBeUndefined();
    });
  });
});
