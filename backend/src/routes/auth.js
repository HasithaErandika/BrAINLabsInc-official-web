import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { getMemberWithRoleByAuthId } from '../db/queries.js';

export const authRouter = Router();

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  first_name:    z.string().min(1).max(100),
  second_name:   z.string().min(1).max(100),
  contact_email: z.string().email().max(150),
  password:      z.string().min(8).max(255),
  role:          z.enum(['researcher', 'research_assistant']),
});

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  });
}

// ─── POST /auth/register ──────────────────────────────────────────────────────

authRouter.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { first_name, second_name, contact_email, password, role } = parsed.data;

  // 1. Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: contact_email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    return res.status(500).json({ error: authError.message });
  }

  const authUserId = authData.user.id;

  // 2. Generate slug from name
  const slugBase = `${first_name}-${second_name}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const slug = `${slugBase}-${authUserId.slice(0, 6)}`;

  // 3. Insert into member table
  const { data: member, error: memberError } = await supabase
    .from('member')
    .insert({ first_name, second_name, contact_email, slug, auth_user_id: authUserId })
    .select()
    .single();

  if (memberError) {
    console.error('[RegistrationError] Member Insert:', memberError);
    await supabase.auth.admin.deleteUser(authUserId);
    
    // User-friendly error mapping
    if (memberError.code === '42501') return res.status(500).json({ error: 'Server configuration error (Security policy). Please contact admin.' });
    if (memberError.code === '23505') return res.status(409).json({ error: 'Email or identity already exists in system.' });
    
    return res.status(500).json({ error: 'An unexpected error occurred during profile creation.' });
  }

  // 4. Insert role-specific row (approval_status defaults to PENDING)
  const roleTable = role === 'researcher' ? 'researcher' : 'research_assistant';
  const { error: roleError } = await supabase
    .from(roleTable)
    .insert({ member_id: member.id });

  if (roleError) {
    console.error('[RegistrationError] Role Insert:', roleError);
    await supabase.auth.admin.deleteUser(authUserId);
    return res.status(500).json({ error: 'An unexpected error occurred while assigning your role.' });
  }

  return res.status(201).json({
    message: 'Registration successful. Your account is pending admin approval.',
    memberId: member.id,
  });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

authRouter.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  // 1. Authenticate with Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // 2. Resolve member + role from DB
  let memberData;
  try {
    memberData = await getMemberWithRoleByAuthId(authData.user.id);
  } catch {
    return res.status(403).json({ error: 'Account not found in system. Contact admin.' });
  }

  const { member, role, roleRow } = memberData;
  const isPendingOrRejected = roleRow?.approval_status === 'PENDING' || roleRow?.approval_status === 'REJECTED';

  // 3. Handle status-based access (Admins are implicitly approved)
  if (role !== 'admin' && roleRow?.approval_status === 'REJECTED') {
    return res.status(403).json({ error: 'Account access denied. Your application was rejected.' });
  }

  // 4. Sign our own JWT
  const token = signToken({
    sub:   member.id,
    role,
    email: member.contact_email,
    slug:  member.slug,
  });

  return res.json({
    token,
    user: {
      id:            member.id,
      first_name:    member.first_name,
      second_name:   member.second_name,
      email:         member.contact_email,
      slug:          member.slug,
      role,
      approval_status: role === 'admin' ? null : roleRow?.approval_status,
    },
  });
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
// Stateless JWT — logout is handled client-side (remove token from storage).
authRouter.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out successfully' });
});
