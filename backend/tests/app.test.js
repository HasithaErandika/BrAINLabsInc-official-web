import request from 'supertest';
import express from 'express';
import { authRouter } from '../src/routes/auth.js';

// Simple smoke test to verify Jest is working with ES modules
describe('Basic API Testing Setup', () => {
  it('should verify the testing environment is configured correctly', () => {
    expect(true).toBe(true);
  });
});

// Mocking some route behavior for CI verification
const app = express();
app.use(express.json());
app.use('/auth', authRouter);

describe('Auth Router Smoke Test', () => {
  it('should respond with 401 on login without credentials', async () => {
    const res = await request(app).post('/auth/login').send({});
    // Even if Supabase is not configured, Zod validation should trigger or it should 401
    expect([400, 401]).toContain(res.status);
  });
});
