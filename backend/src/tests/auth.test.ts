import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect('mongodb://localhost:27017/feedpulse_test');
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

test('GET /api/feedback — rejects request with no token', async () => {
  const res = await request(app).get('/api/feedback');
  expect(res.status).toBe(401);
  expect(res.body.success).toBe(false);
});

test('GET /api/feedback — rejects bad token', async () => {
  const res = await request(app)
    .get('/api/feedback')
    .set('Authorization', 'Bearer fake.token.here');
  expect(res.status).toBe(401);
  expect(res.body.success).toBe(false);
});

test('POST /api/auth/login — succeeds with correct credentials', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@feedpulse.com', password: 'admin123' });
  expect(res.status).toBe(200);
  expect(res.body.data.token).toBeDefined();
});

test('POST /api/auth/login — fails with wrong password', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@feedpulse.com', password: 'wrongpassword' });
  expect(res.status).toBe(401);
  expect(res.body.success).toBe(false);
});