import request from 'supertest';
import { app } from '../app';

const TENANT_ID = '123e4567-e89b-12d3-a456-426614174100';

const adminUser = {
  tenantId: TENANT_ID,
  name: 'Companies Admin',
  identifier: 'companies.admin',
  password: 'senha1234',
  role: 'admin',
};

const collaboratorUser = {
  tenantId: TENANT_ID,
  name: 'Companies Collab',
  identifier: 'companies.collab',
  password: 'senha1234',
  role: 'collaborator',
  sector: 'fiscal',
};

let adminToken = '';
let collaboratorToken = '';

async function login(identifier: string, password: string): Promise<string> {
  const res = await request(app).post('/auth/login').send({ identifier, password });
  return res.body.data.token as string;
}

beforeAll(async () => {
  await request(app).post('/users').send(adminUser);
  await request(app).post('/users').send(collaboratorUser);
  adminToken = await login(adminUser.identifier, adminUser.password);
  collaboratorToken = await login(collaboratorUser.identifier, collaboratorUser.password);
});

describe('UC-E01 — Companies CRUD', () => {
  describe('POST /companies', () => {
    it('should create a company with minimum fields', async () => {
      const res = await request(app)
        .post('/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tenantId: TENANT_ID,
          name: 'Empresa Teste LTDA',
          cnpj: '12.345.678/0001-95',
          sector: 'fiscal',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cnpj).toBe('12345678000195');
      expect(res.body.data.isActive).toBe(true);
    });

    it('should reject duplicate CNPJ', async () => {
      const payload = {
        tenantId: TENANT_ID,
        name: 'Outra Empresa',
        cnpj: '11222333000181',
        sector: 'fiscal',
      };
      await request(app)
        .post('/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      const res = await request(app)
        .post('/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CNPJ_ALREADY_EXISTS');
    });

    it('should reject invalid CNPJ format', async () => {
      const res = await request(app)
        .post('/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tenantId: TENANT_ID,
          name: 'Empresa Invalida',
          cnpj: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should forbid collaborators from creating companies (RN-002)', async () => {
      const res = await request(app)
        .post('/companies')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({
          tenantId: TENANT_ID,
          name: 'Outra Empresa',
          cnpj: '99888777000166',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /companies/:id', () => {
    it('should update company name', async () => {
      const create = await request(app)
        .post('/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tenantId: TENANT_ID, name: 'Empresa Original', cnpj: '55444333000122' });

      const id = create.body.data.id;
      const res = await request(app)
        .put(`/companies/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Empresa Renomeada' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Empresa Renomeada');
    });

    it('should reject CNPJ that conflicts with another company', async () => {
      const a = await request(app)
        .post('/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tenantId: TENANT_ID, name: 'Conflito A', cnpj: '12121212000123' });
      const b = await request(app)
        .post('/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tenantId: TENANT_ID, name: 'Conflito B', cnpj: '34343434000134' });

      expect(a.status).toBe(201);
      expect(b.status).toBe(201);

      const res = await request(app)
        .put(`/companies/${a.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cnpj: '34343434000134' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CNPJ_ALREADY_EXISTS');
    });
  });

  describe('PATCH /companies/:id/inactivate', () => {
    it('should inactivate a company without pending demands', async () => {
      const create = await request(app)
        .post('/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tenantId: TENANT_ID, name: 'Para Inativar', cnpj: '77666555000133' });

      const id = create.body.data.id;
      const res = await request(app)
        .patch(`/companies/${id}/inactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);
    });

    it('should refuse to inactivate twice', async () => {
      const create = await request(app)
        .post('/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tenantId: TENANT_ID, name: 'Dupla Inativacao', cnpj: '88777666000144' });

      const id = create.body.data.id;
      await request(app)
        .patch(`/companies/${id}/inactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      const res = await request(app)
        .patch(`/companies/${id}/inactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ALREADY_INACTIVE');
    });
  });
});

describe('UC-E03 — Companies listing with filters', () => {
  it('should list companies and require authentication', async () => {
    const res = await request(app).get('/companies').query({ tenantId: TENANT_ID });
    expect(res.status).toBe(401);
  });

  it('should filter by situation=active', async () => {
    const res = await request(app)
      .get('/companies')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ tenantId: TENANT_ID, situation: 'active' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    for (const c of res.body.data.items) {
      expect(c.isActive).toBe(true);
    }
  });

  it('should filter by name (case-insensitive partial match)', async () => {
    await request(app)
      .post('/companies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tenantId: TENANT_ID, name: 'Padaria Trigo Dourado', cnpj: '33222111000155' });

    const res = await request(app)
      .get('/companies')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ tenantId: TENANT_ID, name: 'trigo' });

    expect(res.status).toBe(200);
    expect(res.body.data.items.some((c: { name: string }) => c.name.includes('Trigo'))).toBe(true);
  });

  it('should return informative message when list is empty', async () => {
    const res = await request(app)
      .get('/companies')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ tenantId: TENANT_ID, name: 'inexistente-xyz-zzz' });

    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.message).toBeDefined();
  });

  it('should restrict collaborator to companies of their sector (RN-013)', async () => {
    await request(app)
      .post('/companies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tenantId: TENANT_ID, name: 'Setor Fiscal Co', cnpj: '44333222000166', sector: 'fiscal' });
    await request(app)
      .post('/companies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tenantId: TENANT_ID, name: 'Setor Contabil Co', cnpj: '55444333000177', sector: 'contabil' });

    const res = await request(app)
      .get('/companies')
      .set('Authorization', `Bearer ${collaboratorToken}`)
      .query({ tenantId: TENANT_ID });

    expect(res.status).toBe(200);
    for (const c of res.body.data.items) {
      expect(c.sector).toBe('fiscal');
    }
  });
});
