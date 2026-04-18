const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('publication').select('id, title, approval_status');
  if (error) { console.error(error); return; }
  const titles = {};
  data.forEach(item => {
    if (!titles[item.title]) titles[item.title] = [];
    titles[item.title].push(item);
  });
  Object.keys(titles).forEach(t => {
    if (titles[t].length > 1) {
      console.log('Duplicate found:', t);
      titles[t].forEach(i => console.log('  ID:', i.id, 'Status:', i.approval_status));
    }
  });
}
check();
