import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import { createClient } from '@supabase/supabase-js';
import { team } from './team.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedTeam() {
  console.log("Seeding Team...");

  for (const t of team) {
    const email = t.contact || `${t.id}@brainlabsinc.org`;
    
    console.log(`Processing ${t.name} (${email})...`);

    // 1. Create or get Auth User
    let authUserId;
    const { data: existingUsers, error: listErr } = await supabase.auth.admin.listUsers();
    let existingUser = null;
    if (!listErr) {
      existingUser = existingUsers.users.find(u => u.email === email);
    }
    
    if (existingUser) {
      authUserId = existingUser.id;
      console.log(`  Auth user already exists: ${authUserId}`);
    } else {
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: email,
        password: 'Password123!',
        email_confirm: true
      });
      if (authErr) {
        console.error(`  Auth Error for ${t.name}:`, authErr.message);
        continue;
      }
      authUserId = authData.user.id;
      console.log(`  Created Auth user: ${authUserId}`);
    }

    // Split name
    const parts = t.name.split(' ');
    let firstName = parts[0];
    let secondName = parts.slice(1).join(' ') || 'Unknown';
    if (firstName.includes('.') && parts.length > 2) {
      firstName = parts[0] + ' ' + parts[1];
      secondName = parts.slice(2).join(' ');
    }

    // 2. Upsert Member
    const { data: member, error: memberErr } = await supabase
      .from('member')
      .upsert({
        auth_user_id: authUserId,
        first_name: firstName,
        second_name: secondName,
        contact_email: email,
        slug: t.id
      }, { onConflict: 'auth_user_id' })
      .select()
      .single();

    if (memberErr) {
      console.error(`  Member Insert Error for ${t.name}:`, memberErr.message);
      continue;
    }

    const memberId = member.id;

    // Determine role. If title has "Assistant", they are a research assistant, otherwise researcher.
    const isAssistant = t.position.toLowerCase().includes('assistant');

    if (isAssistant) {
      // Upsert Research Assistant
      const { error: raErr } = await supabase
        .from('research_assistant')
        .upsert({
          member_id: memberId,
          approval_status: 'APPROVED'
        }, { onConflict: 'member_id' });
        
      if (raErr) console.error(`  RA Insert Error for ${t.name}:`, raErr.message);
    } else {
      // Upsert Researcher
      const { error: resErr } = await supabase
        .from('researcher')
        .upsert({
          member_id: memberId,
          approval_status: 'APPROVED',
          country: t.country || null,
          image_url: t.image || null,
          bio: t.summary || t.bio || null,
          occupation: t.position || null,
          workplace: t.university || null
        }, { onConflict: 'member_id' });
        
      if (resErr) console.error(`  Researcher Insert Error for ${t.name}:`, resErr.message);
    }

    // 3. Populate Educational Background & Ongoing Research
    // Only for researchers (as per DB schema constraints)
    if (!isAssistant) {
      if (t.academicQualifications && t.academicQualifications.length > 0) {
        // First delete existing to prevent duplicates on re-runs
        await supabase.from('educational_background').delete().eq('researcher_id', memberId);
        
        for (const qual of t.academicQualifications) {
          await supabase.from('educational_background').insert({
            researcher_id: memberId,
            degree: qual.degree.substring(0, 150)
          });
        }
      }

      if (t.ongoingResearch && t.ongoingResearch.length > 0) {
        // First delete existing
        await supabase.from('ongoing_research').delete().eq('researcher_id', memberId);
        
        for (const research of t.ongoingResearch) {
          await supabase.from('ongoing_research').insert({
            researcher_id: memberId,
            title: research.substring(0, 255)
          });
        }
      }
    }
  }

  console.log("Team Seeding Complete!");
}

seedTeam().catch(console.error);
