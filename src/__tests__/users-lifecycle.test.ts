import request from 'supertest';
import { app } from '../app';

const TENANT_ID = '123e4567-e89b-12d3-a456-426614174200';

const adminUser = {
  tenantId: TENANT_ID,
  name: 'Lifecycle Admin',
  identifier: 'lifecycle.admin',
  password: 'senha1234',
  role: 'admin',
};

const collaboratorUser = {
  tenantId: TENANT_ID,
  name: 'Lifecycle Collab',
  identifier: 'lifecycle.collab',
  password: 'senha1234',
  role: 'collaborator',
  sector: 'fiscal',
};

let adminToken = '';
let collaboratorToken = '';
let collaboratorId = '';

async function login(identifier: string, password: string): Promise<string> {
  const res = await request(app).post('/auth/login').send({ identifier, password });
  return res.body.data.token as string;
}

beforeAll(async () => {
  await request(app).post('/users').send(adminUser);
  const collabRes = await request(app).post('/users').send(collaboratorUser);
  collaboratorId = collabRes.body.data.id;
  adminToken = await login(adminUser.identifier, adminUser.password);
  collaboratorToken = await login(collaboratorUser.identifier, collaboratorUser.password);
});

describe('UC-A03 — User edit / inactivate / reactivate', () => {
  describe('PUT /users/:id', () => {
    it('should let admin edit name and sector', async () => {
      const res = await request(app)
        .put(`/users/${collaboratorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name', sector: 'contabil' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
      expect(res.body.data.sector).toBe('contabil');
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('should reject when identifier conflicts with another user (RN-002)', async () => {
      const newUser = await request(app).post('/users').send({
        tenantId: TENANT_ID,
        name: 'Conflict Source',
        identifier: 'conflict.src',
        password: 'senha1234',
        role: 'admin',
      });

      const res = await request(app)
        .put(`/users/${newUser.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ identifier: adminUser.identifier });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should forbid collaborator from editing users (RN-002)', async () => {
      const res = await request(app)
        .put(`/users/${collaboratorId}`)
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /users/:id/inactivate and /reactivate', () => {
    it('should invalidate active sessions on inactivation', async () => {
      const target = await request(app).post('/users').send({
        tenantId: TENANT_ID,
        name: 'Session Target',
        identifier: 'session.target',
        password: 'senha1234',
        role: 'collaborator',
      });
      const targetId = target.body.data.id;
      const targetToken = await login('session.target', 'senha1234');

      const inactivate = await request(app)
        .patch(`/users/${targetId}/inactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(inactivate.status).toBe(200);
      expect(inactivate.body.data.isActive).toBe(false);

      // Token previously issued should now be rejected.
      const probe = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${targetToken}`);

      expect(probe.status).toBe(401);
      expect(probe.body.error.code).toBe('SESSION_INVALIDATED');

      // Login itself should also be denied while inactive.
      const loginAttempt = await request(app)
        .post('/auth/login')
        .send({ identifier: 'session.target', password: 'senha1234' });
      expect(loginAttempt.status).toBe(403);
    });

    it('should reactivate a user and allow login again', async () => {
      const target = await request(app).post('/users').send({
        tenantId: TENANT_ID,
        name: 'Reactivate Target',
        identifier: 'reactivate.target',
        password: 'senha1234',
        role: 'collaborator',
      });
      const targetId = target.body.data.id;

      await request(app)
        .patch(`/users/${targetId}/inactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      const reactivate = await request(app)
        .patch(`/users/${targetId}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(reactivate.status).toBe(200);
      expect(reactivate.body.data.isActive).toBe(true);

      const loginAttempt = await request(app)
        .post('/auth/login')
        .send({ identifier: 'reactivate.target', password: 'senha1234' });

      expect(loginAttempt.status).toBe(200);
      expect(loginAttempt.body.data.token).toBeDefined();
    });
  });
});
