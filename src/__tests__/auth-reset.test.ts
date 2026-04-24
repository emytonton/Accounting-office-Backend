import request from 'supertest';
import { app } from '../app';
import { consoleEmailService } from '../shared/services/email.service';

const TENANT_ID = '223e4567-e89b-12d3-a456-426614174001';

const activeUser = {
  tenantId: TENANT_ID,
  name: 'Reset Test User',
  identifier: 'reset.user@test.com',
  password: 'senha1234',
  role: 'admin',
};

const invitedUser = {
  tenantId: TENANT_ID,
  name: 'First Access User',
  identifier: 'firstaccess.user@test.com',
  role: 'collaborator',
  // no password — first access scenario
};

beforeAll(async () => {
  await request(app).post('/users').send(activeUser);
  await request(app).post('/users').send(invitedUser);
});

function lastCode(): string {
  return consoleEmailService.sent[consoleEmailService.sent.length - 1].code;
}

describe('POST /auth/forgot-password', () => {
  it('should return generic success for registered email', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: activeUser.identifier });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('If your email is registered');
  });

  it('should return same generic success for unregistered email (no info leak)', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'nao.existe@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('If your email is registered');
  });

  it('should return 400 when email field is missing', async () => {
    const res = await request(app).post('/auth/forgot-password').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/reset-password/validate', () => {
  it('should return isFirstAccess=false for password recovery', async () => {
    await request(app).post('/auth/forgot-password').send({ email: activeUser.identifier });
    const code = lastCode();

    const res = await request(app)
      .post('/auth/reset-password/validate')
      .send({ identifier: activeUser.identifier, code });
    expect(res.status).toBe(200);
    expect(res.body.data.isFirstAccess).toBe(false);
  });

  it('should return isFirstAccess=true for first access user', async () => {
    await request(app).post('/auth/forgot-password').send({ email: invitedUser.identifier });
    const code = lastCode();

    const res = await request(app)
      .post('/auth/reset-password/validate')
      .send({ identifier: invitedUser.identifier, code });
    expect(res.status).toBe(200);
    expect(res.body.data.isFirstAccess).toBe(true);
  });

  it('should return 400 for invalid code', async () => {
    const res = await request(app)
      .post('/auth/reset-password/validate')
      .send({ identifier: activeUser.identifier, code: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_RESET_TOKEN');
  });
});

describe('POST /auth/reset-password', () => {
  it('should reset password and allow login with new password', async () => {
    await request(app).post('/auth/forgot-password').send({ email: activeUser.identifier });
    const code = lastCode();

    const resetRes = await request(app)
      .post('/auth/reset-password')
      .send({ identifier: activeUser.identifier, code, newPassword: 'novaSenha123' });
    expect(resetRes.status).toBe(200);

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ identifier: activeUser.identifier, password: 'novaSenha123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.token).toBeDefined();
  });

  it('should reject code after single use (RN-014)', async () => {
    await request(app).post('/auth/forgot-password').send({ email: activeUser.identifier });
    const code = lastCode();

    await request(app)
      .post('/auth/reset-password')
      .send({ identifier: activeUser.identifier, code, newPassword: 'outraSenha456' });

    const res = await request(app)
      .post('/auth/reset-password')
      .send({ identifier: activeUser.identifier, code, newPassword: 'tentandoDeNovo789' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_RESET_TOKEN');
  });

  it('should return 400 for invalid code', async () => {
    const res = await request(app)
      .post('/auth/reset-password')
      .send({ identifier: activeUser.identifier, code: '000000', newPassword: 'qualquerSenha123' });
    expect(res.status).toBe(400);
  });

  it('should set password and allow login for first access user', async () => {
    await request(app).post('/auth/forgot-password').send({ email: invitedUser.identifier });
    const code = lastCode();

    await request(app)
      .post('/auth/reset-password')
      .send({ identifier: invitedUser.identifier, code, newPassword: 'primeiraSenha123' });

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ identifier: invitedUser.identifier, password: 'primeiraSenha123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.token).toBeDefined();
  });
});
