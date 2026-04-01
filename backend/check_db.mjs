import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('member')
    .select(`
      *,
      admin ( member_id ),
      researcher ( member_id, approval_status ),
      research_assistant ( member_id, approval_status )
    `);

  if (error) {
    console.error('Error fetching members:', error);
    return;
  }

  console.log('Members found:', data.length);
  for (const m of data) {
    console.log('-------------------');
    console.log('Email:', m.contact_email);
    console.log('ID:', m.id);
    console.log('Admin Join:', JSON.stringify(m.admin));
    console.log('Researcher Join:', JSON.stringify(m.researcher));
    console.log('RA Join:', JSON.stringify(m.research_assistant));
    
    // Check truthiness
    if (m.admin && (Array.isArray(m.admin) ? m.admin.length > 0 : true)) {
        console.log(' >> Identified as ADMIN');
    } else if (m.researcher && (Array.isArray(m.researcher) ? m.researcher.length > 0 : true)) {
        console.log(' >> Identified as RESEARCHER');
    } else if (m.research_assistant && (Array.isArray(m.research_assistant) ? m.research_assistant.length > 0 : true)) {
        console.log(' >> Identified as RESEARCH_ASSISTANT');
    } else {
        console.log(' >> Identified as PENDING (no role row found)');
    }
  }
}

check();
