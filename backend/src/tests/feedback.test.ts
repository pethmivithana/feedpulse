import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';

jest.mock('../services/gemini.service', () => ({
  analyzeWithGemini: jest.fn().mockResolvedValue({
    category: 'Bug',
    sentiment: 'Negative',
    priority_score: 8,
    summary: 'Test summary',
    tags: ['UI', 'Test'],
  }),
  generateWeeklySummary: jest.fn().mockResolvedValue('Mock weekly summary'),
}));

let adminToken: string;
let createdId: string;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect('mongodb://localhost:27017/feedpulse_test');
  }
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@feedpulse.com', password: 'admin123' });
  adminToken = res.body.data.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('POST /api/feedback — valid submission saves to DB', async () => {
  const res = await request(app)
    .post('/api/feedback')
    .send({
      title: 'Test feedback title',
      description: 'This is a test description that is long enough to pass validation.',
      category: 'Bug',
    });
  expect(res.status).toBe(201);
  expect(res.body.success).toBe(true);
  createdId = res.body.data._id;
});

test('POST /api/feedback — rejects empty title', async () => {
  const res = await request(app)
    .post('/api/feedback')
    .send({ title: '', description: 'This description is long enough.', category: 'Bug' });
  expect(res.status).toBe(400);
  expect(res.body.success).toBe(false);
});

test('POST /api/feedback — rejects description under 20 chars', async () => {
  const res = await request(app)
    .post('/api/feedback')
    .send({ title: 'Valid title', description: 'Too short', category: 'Bug' });
  expect(res.status).toBe(400);
  expect(res.body.success).toBe(false);
});

test('PATCH /api/feedback/:id — status update works correctly', async () => {
  const res = await request(app)
    .patch(`/api/feedback/${createdId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'In Review' });
  expect(res.status).toBe(200);
  expect(res.body.data.status).toBe('In Review');
});

test('PATCH /api/feedback/:id — rejects invalid status', async () => {
  const res = await request(app)
    .patch(`/api/feedback/${createdId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'InvalidStatus' });
  expect(res.status).toBe(400);
  expect(res.body.success).toBe(false);
});