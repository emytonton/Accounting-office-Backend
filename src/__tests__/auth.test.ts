import request from 'supertest';
import { app } from '../app';

const TENANT_ID = '123e4567-e89b-12d3-a456-426614174000';

const testUser = {
  tenantId: TENANT_ID,
  name: 'Auth Test User',
  identifier: 'auth.testuser',
  password: 'senha1234',
  role: 'admin',
};

beforeAll(async () => {
  await request(app).post('/users').send(testUser);
});

describe('POST /auth/login', () => {
  it('should login successfully and return token without exposing passwordHash', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ identifier: testUser.identifier, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.expiresIn).toBeDefined();
    expect(res.body.data.user.identifier).toBeUndefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.data.user.tenantId).toBe(TENANT_ID);
  });

  it('should return 401 with generic message for wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ identifier: testUser.identifier, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 401 with the same generic message for non-existent user', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ identifier: 'nao.existe', password: 'qualquercoisa' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    // Must be the same message — never reveal "user not found"
    expect(res.body.error.message).toBe('Invalid credentials');
  });

  it('should return 400 when fields are missing', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should block after 5 failed attempts (RNF-003)', async () => {
    const blockedIdentifier = 'blocked.user.test';

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/auth/login')
        .send({ identifier: blockedIdentifier, password: 'wrong' });
    }

    const res = await request(app)
      .post('/auth/login')
      .send({ identifier: blockedIdentifier, password: 'wrong' });

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('TOO_MANY_ATTEMPTS');
  });
});

describe('POST /auth/logout', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(401);
  });

  it('should logout successfully with valid token', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ identifier: testUser.identifier, password: testUser.password });

    const { token } = loginRes.body.data;

    const res = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
