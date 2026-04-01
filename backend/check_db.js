require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('member')
    .select(`
      *,
      admin ( member_id ),
      researcher ( member_id, approval_status ),
      research_assistant ( member_id, approval_status )
    `)
    .limit(5);

  if (error) {
    console.error('Error fetching members:', error);
    return;
  }

  console.log('Members found:', data.length);
  data.forEach(m => {
    console.log('Member:', m.contact_email);
    console.log(' - admin:', m.admin);
    console.log(' - researcher:', m.researcher);
    console.log(' - research_assistant:', m.research_assistant);
  });
}

check();
