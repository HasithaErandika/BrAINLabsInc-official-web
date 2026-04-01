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
    `)
    .eq('id', 1)
    .single();
  console.log(JSON.stringify(data, null, 2));
}
check();
