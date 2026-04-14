/**
 * db/queries.js
 * Central database access layer for BrAIN Labs API.
 * All Supabase interactions go through this module.
 */
import { supabase } from '../config/supabase.js';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────────────────────

/** Throws an error with HTTP status attached */
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/** Robust check: Supabase joins can return an object or a single-item array */
export const getJoined = (val) => (Array.isArray(val) ? (val.length > 0 ? val[0] : null) : val);

// ─────────────────────────────────────────────────────────────────────────────
// MEMBER + ROLE RESOLUTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve a member's full profile + role from their Supabase auth_user_id.
 * Returns: { member, role, roleRow }
 */
export async function getMemberWithRoleByAuthId(authUserId) {
  const { data, error } = await supabase
    .from('member')
    .select(`
      *,
      admin ( member_id ),
      researcher ( member_id, country, linkedin_url, image_url, bio, occupation, workplace, approval_status, approved_by_admin_id ),
      research_assistant ( member_id, assigned_by_researcher_id, approval_status, approved_by_admin_id )
    `)
    .eq('auth_user_id', authUserId)
    .single();

  if (error || !data) throw httpError(404, 'Member not found');

  let role = 'pending';
  let roleRow = null;

  const adminRow = getJoined(data.admin);
  const researcherRow = getJoined(data.researcher);
  const raRow = getJoined(data.research_assistant);

  if (adminRow) {
    role = 'admin';
    roleRow = adminRow;
  } else if (researcherRow) {
    role = 'researcher';
    roleRow = researcherRow;
  } else if (raRow) {
    role = 'research_assistant';
    roleRow = raRow;
  }

  if (role === 'pending') {
    throw httpError(403, 'Account not found in system (No assigned role). Contact admin.');
  }

  const { admin, researcher, research_assistant, ...member } = data;
  return { member, role, roleRow };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT HELPERS (generic approval)
// ─────────────────────────────────────────────────────────────────────────────

const APPROVABLE_TABLES = ['blog', 'tutorial', 'project', 'event', 'grant_info', 'publication'];

export async function approveContent(table, id, adminMemberId) {
  if (!APPROVABLE_TABLES.includes(table)) throw httpError(400, `Invalid content table: ${table}`);
  const { data, error } = await supabase
    .from(table)
    .update({ approval_status: 'APPROVED', approved_by_admin_id: adminMemberId })
    .eq('id', id)
    .select()
    .single();
  if (error) throw httpError(500, error.message);
  return data;
}

export async function rejectContent(table, id, adminMemberId) {
  if (!APPROVABLE_TABLES.includes(table)) throw httpError(400, `Invalid content table: ${table}`);
  const { data, error } = await supabase
    .from(table)
    .update({ approval_status: 'REJECTED', approved_by_admin_id: adminMemberId })
    .eq('id', id)
    .select()
    .single();
  if (error) throw httpError(500, error.message);
  return data;
}

export async function getAllPendingContent() {
  const results = {};
  await Promise.all(
    APPROVABLE_TABLES.map(async (table) => {
      const { data } = await supabase
        .from(table)
        .select('*')
        .eq('approval_status', 'PENDING_ADMIN')
        .order('created_at', { ascending: false });
      results[table] = data ?? [];
    })
  );
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// EDUCATIONAL BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────

export async function addEducation(researcherId, degree) {
  const { data, error } = await supabase
    .from('educational_background')
    .insert({ researcher_id: researcherId, degree })
    .select()
    .single();
  if (error) throw httpError(500, error.message);
  return data;
}

export async function deleteEducation(id, researcherId) {
  const { error } = await supabase
    .from('educational_background')
    .delete()
    .eq('id', id)
    .eq('researcher_id', researcherId);
  if (error) throw httpError(500, error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// ONGOING RESEARCH
// ─────────────────────────────────────────────────────────────────────────────

export async function addOngoingResearch(researcherId, title) {
  const { data, error } = await supabase
    .from('ongoing_research')
    .insert({ researcher_id: researcherId, title })
    .select()
    .single();
  if (error) throw httpError(500, error.message);
  return data;
}

export async function deleteOngoingResearch(id, researcherId) {
  const { error } = await supabase
    .from('ongoing_research')
    .delete()
    .eq('id', id)
    .eq('researcher_id', researcherId);
  if (error) throw httpError(500, error.message);
}
