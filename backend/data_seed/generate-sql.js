import fs from 'fs';
import { blogPosts } from './data_seed/blog.js';
import { pastEvents, upcomingEvents } from './data_seed/events.js';
import { grants } from './data_seed/grants.js';
import { projects } from './data_seed/projects.js';
import { publications } from './data_seed/publications.js';

let sql = `
DO $$ 
DECLARE
  v_admin_id bigint;
  v_researcher_id bigint;
  v_blog_id bigint;
  v_pub_id bigint;
BEGIN
  -- Get Member IDs from Auth UUIDs
  SELECT id INTO v_admin_id FROM member WHERE auth_user_id = 'd9bb30fe-79d1-4997-832c-072cb73c1e74';
  SELECT id INTO v_researcher_id FROM member WHERE auth_user_id = '1b87068e-07b9-4c9a-965a-cbd3f03eb6d0';

  IF v_admin_id IS NULL OR v_researcher_id IS NULL THEN
     RAISE NOTICE 'Admin or Researcher member not found in database. Seed skipped.';
     RETURN;
  END IF;

  RAISE NOTICE 'Using Admin ID: % and Researcher ID: %', v_admin_id, v_researcher_id;

`;

// Blogs
for (const post of blogPosts) {
  const safeTitle = post.title.replace(/'/g, "''");
  const safeDesc = post.excerpt.replace(/'/g, "''");
  const safeContent = post.content.replace(/'/g, "''");
  sql += `
  INSERT INTO blog (title, description, content, created_by_member_id, approval_status, approved_by_admin_id) 
  VALUES ('${safeTitle}', '${safeDesc}', '${safeContent}', v_researcher_id, 'APPROVED', v_admin_id)
  RETURNING id INTO v_blog_id;
  `;
  if (post.image) {
    sql += `  INSERT INTO blog_image (blog_id, image_url) VALUES (v_blog_id, '${post.image.replace(/'/g, "''")}');\n`;
  }
  for (const tag of post.tags) {
    sql += `  INSERT INTO blog_keyword (blog_id, keyword) VALUES (v_blog_id, '${tag.replace(/'/g, "''")}');\n`;
  }
}

// Events
const allEvents = [...pastEvents, ...upcomingEvents];
for (const ev of allEvents) {
  const safeTitle = ev.title.replace(/'/g, "''");
  const safeDesc = ev.description.replace(/'/g, "''");
  let d = 'NULL';
  try {
     const dateObj = new Date(ev.date);
     if(!isNaN(dateObj.getTime())) {
        d = `'${dateObj.toISOString().split('T')[0]}'`;
     } else if(ev.date.includes('2025')) {
        d = `'2025-08-01'`; // Fallback for "August 2025"
     }
  } catch(e) {}

  sql += `
  INSERT INTO event (title, description, event_date, approval_status, created_by_researcher, approved_by_admin_id)
  VALUES ('${safeTitle}', '${safeDesc}', ${d}, 'APPROVED', v_researcher_id, v_admin_id);
  `;
}

// Grants
for (const g of grants) {
  const safeTitle = g.title.replace(/'/g, "''");
  const safeDesc = g.description.replace(/'/g, "''");
  sql += `
  INSERT INTO grant_info (title, description, passed_date, expire_date, approval_status, created_by_researcher, approved_by_admin_id)
  VALUES ('${safeTitle}', '${safeDesc}', '2025-01-01', '2026-01-01', 'APPROVED', v_researcher_id, v_admin_id);
  `;
}

// Projects
for (const cat of projects) {
  for (const proj of cat.items) {
    const safeTitle = proj.title.replace(/'/g, "''");
    const safeDesc = proj.description.replace(/'/g, "''");
    sql += `
  INSERT INTO project (title, description, approval_status, created_by_member_id, approved_by_admin_id)
  VALUES ('${safeTitle}', '${safeDesc}', 'APPROVED', v_researcher_id, v_admin_id);
    `;
  }
}

// Publications
for (const pub of publications) {
  const safeTitle = pub.title.replace(/'/g, "''");
  const safeAuthors = pub.authors.replace(/'/g, "''");
  const safeVenue = pub.venue.replace(/'/g, "''");
  sql += `
  INSERT INTO publication (title, approval_status, created_by_member_id, approved_by_admin_id)
  VALUES ('${safeTitle}', 'APPROVED', v_researcher_id, v_admin_id)
  RETURNING id INTO v_pub_id;
  `;
  sql += `
  INSERT INTO journal (publication_id, link, description)
  VALUES (v_pub_id, '${pub.link || ''}', '${safeAuthors} | ${safeVenue}');
  `;
}

sql += `
END $$;
`;

fs.writeFileSync('seed.sql', sql);
console.log("seed.sql generated successfully!");
