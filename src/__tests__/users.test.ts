import request from 'supertest';
import { app } from '../app';

const validPayload = {
  tenantId: '123e4567-e89b-12d3-a456-426614174000',
  name: 'John Doe',
  identifier: 'john.doe',
  password: 'secret123',
  role: 'admin',
};

describe('POST /users', () => {
  it('should create a user and return 201 without passwordHash', async () => {
    const res = await request(app).post('/users').send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.identifier).toBe('john.doe');
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app).post('/users').send({ name: 'Incomplete' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when password is too short', async () => {
    const res = await request(app).post('/users').send({ ...validPayload, password: '123' });
    expect(res.status).toBe(400);
  });

  it('should return 409 when identifier already exists for the same tenant', async () => {
    await request(app).post('/users').send({ ...validPayload, identifier: 'duplicate.user' });
    const res = await request(app).post('/users').send({ ...validPayload, identifier: 'duplicate.user' });
    expect(res.status).toBe(409);
  });
});

describe('GET /users', () => {
  it('should return list of users for a tenant', async () => {
    const res = await request(app)
      .get('/users')
      .query({ tenantId: '123e4567-e89b-12d3-a456-426614174000' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
