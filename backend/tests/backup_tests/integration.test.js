import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock Supabase client
jest.unstable_mockModule('../../src/config/supabase.js', () => ({
  supabase: {
    auth: {
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
      },
      signInWithPassword: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
        single: jest.fn(),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
        order: jest.fn(() => ({
          select: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(),
            })),
          })),
        })),
      })),
    })),
  },
}));

// Mock Database Queries
jest.unstable_mockModule('../../src/db/queries.js', () => ({
  getMemberWithRoleByAuthId: jest.fn(),
  getMemberWithRoleById: jest.fn(),
  getJoined: jest.fn(val => (Array.isArray(val) ? (val.length > 0 ? val[0] : null) : val)),
  approveContent: jest.fn(),
  rejectContent: jest.fn(),
  getAllPendingContent: jest.fn(),
  getEducationByResearcher: jest.fn(),
  addEducation: jest.fn(),
  deleteEducation: jest.fn(),
  getOngoingResearch: jest.fn(),
  addOngoingResearch: jest.fn(),
  deleteOngoingResearch: jest.fn(),
}));

// Re-set JWT Secret for consistency
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

// Dynamic imports after mocks are declared
const { authRouter } = await import('../../src/routes/auth.js');
const { adminRouter } = await import('../../src/routes/admin.js');
const { meRouter } = await import('../../src/routes/me.js');
const { supabase } = await import('../../src/config/supabase.js');
const { getMemberWithRoleByAuthId } = await import('../../src/db/queries.js');

const app = express();
app.use(express.json());

// Routes
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/me', meRouter);

describe('Build Verification: Core Integration (10 Test Cases)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to generate a token for tests
  const signToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET);

  // 1. Registration (Researcher)
  it('CASE 1: should register a new researcher successfully', async () => {
    supabase.auth.admin.createUser.mockResolvedValue({ data: { user: { id: 'auth-123' } }, error: null });
    supabase.from.mockImplementation((table) => ({
      insert: jest.fn().mockImplementation(() => {
        if (table === 'member') {
          return { select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }) }) };
        }
        return { select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: {}, error: null }) }) };
      }),
    }));

    const res = await request(app).post('/auth/register').send({
      first_name: 'Jane',
      second_name: 'Doe',
      contact_email: 'jane@example.com',
      password: 'password123',
      role: 'researcher'
    });

    expect(res.status).toBe(201);
  });

  // 2. Registration (Assistant)
  it('CASE 2: should register a new research assistant successfully', async () => {
    supabase.auth.admin.createUser.mockResolvedValue({ data: { user: { id: 'auth-456' } }, error: null });
    supabase.from.mockImplementation((table) => ({
      insert: jest.fn().mockImplementation(() => {
        if (table === 'member') {
          return { select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 2 }, error: null }) }) };
        }
        return { select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: {}, error: null }) }) };
      }),
    }));

    const res = await request(app).post('/auth/register').send({
      first_name: 'John',
      second_name: 'Smith',
      contact_email: 'john@example.com',
      password: 'password123',
      role: 'research_assistant'
    });

    expect(res.status).toBe(201);
  });

  // 3. Registration Validation
  it('CASE 3: should return 400 for invalid registration data (missing role)', async () => {
    const res = await request(app).post('/auth/register').send({
      first_name: 'Jane',
      second_name: 'Doe',
      contact_email: 'jane@example.com',
      password: 'password123'
    });

    expect(res.status).toBe(400);
  });

  // 4. Login (Success)
  it('CASE 4: should login successfully and return a token', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'auth-123' } }, error: null });
    getMemberWithRoleByAuthId.mockResolvedValue({
      member: { id: 1, first_name: 'Jane', second_name: 'Doe', contact_email: 'jane@example.com', slug: 'jane-doe' },
      role: 'researcher',
      roleRow: { approval_status: 'APPROVED' }
    });

    const res = await request(app).post('/auth/login').send({
      email: 'jane@example.com',
      password: 'password123'
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  // 5. Login (Failure)
  it('CASE 5: should fail login with incorrect credentials', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: null, error: { message: 'Invalid' } });

    const res = await request(app).post('/auth/login').send({
      email: 'wrong@example.com',
      password: 'wrong'
    });

    expect(res.status).toBe(401);
  });

  // 6. Identity Check (/me)
  it('CASE 6: should return current user info when authenticated', async () => {
    const token = signToken({ sub: 1, role: 'researcher', email: 'jane@example.com' });

    // meRouter uses direct supabase call
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 1, first_name: 'Jane', second_name: 'Doe', contact_email: 'jane@example.com',
              admin: [], researcher: [{ approval_status: 'APPROVED' }], research_assistant: []
            },
            error: null
          })
        })
      })
    });

    const res = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.first_name).toBe('Jane');
  });

  // 7. Admin: Get Members
  it('CASE 7: should allow admin to view member directory', async () => {
    const adminToken = signToken({ sub: 99, role: 'admin' });
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: [{ id: 1, first_name: 'User' }], error: null })
      })
    });

    const res = await request(app)
      .get('/admin/members')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  // 8. Admin: Approve Member
  it('CASE 8: should approve a pending member', async () => {
    const adminToken = signToken({ sub: 99, role: 'admin' });
    supabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null })
          })
        })
      })
    });

    const res = await request(app)
      .patch('/admin/members/1/approve')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  // 9. Admin: Reject Member
  it('CASE 9: should reject a pending member', async () => {
    const adminToken = signToken({ sub: 99, role: 'admin' });
    supabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null })
          })
        })
      })
    });

    const res = await request(app)
      .patch('/admin/members/1/reject')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  // 10. Admin: RBAC Violation
  it('CASE 10: should deny non-admin access to admin directory', async () => {
    const researcherToken = signToken({ sub: 1, role: 'researcher' });
    const res = await request(app)
      .get('/admin/members')
      .set('Authorization', `Bearer ${researcherToken}`);

    expect(res.status).toBe(403);
  });
});
