import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

import { blogPosts } from './data_seed/blog.js';
import { pastEvents, upcomingEvents } from './data_seed/events.js';
import { grants } from './data_seed/grants.js';
import { projects } from './data_seed/projects.js';
import { publications } from './data_seed/publications.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const adminUid = 'd9bb30fe-79d1-4997-832c-072cb73c1e74';
  const researcherUid = '1b87068e-07b9-4c9a-965a-cbd3f03eb6d0';

  // 1. Get member IDs
  const { data: adminMember } = await supabase.from('member').select('id').eq('auth_user_id', adminUid).single();
  const { data: researcherMember } = await supabase.from('member').select('id').eq('auth_user_id', researcherUid).single();

  if (!adminMember || !researcherMember) {
    throw new Error("Could not find members for the provided auth UUIDs.");
  }

  const adminId = adminMember.id;
  const researcherId = researcherMember.id;

  console.log(`Using adminId: ${adminId}, researcherId: ${researcherId}`);

  // Insert blogs
  console.log("Seeding Blogs...");
  for (const post of blogPosts) {
    const { data: blog, error: blogErr } = await supabase.from('blog').insert({
      title: post.title,
      description: post.excerpt,
      content: post.content,
      created_by_member_id: researcherId,
      approval_status: 'APPROVED',
      approved_by_admin_id: adminId,
    }).select().single();
    
    if (blogErr) { console.error("Blog Error:", blogErr.message); continue; }
    
    if (post.image) {
      await supabase.from('blog_image').insert({ blog_id: blog.id, image_url: post.image });
    }
    for (const tag of post.tags) {
      await supabase.from('blog_keyword').insert({ blog_id: blog.id, keyword: tag });
    }
  }

  // Insert events
  console.log("Seeding Events...");
  const allEvents = [...pastEvents, ...upcomingEvents];
  for (const ev of allEvents) {
    let dateStr = null;
    try {
       const dateObj = new Date(ev.date);
       if(!isNaN(dateObj.getTime())) {
          dateStr = dateObj.toISOString().split('T')[0];
       } else if (ev.date.includes('2025')) {
          dateStr = '2025-08-01';
       }
    } catch(e) {}

    const { error } = await supabase.from('event').insert({
      title: ev.title,
      description: ev.description,
      event_datetime: dateStr,
      premises: 'TBD',
      host: 'BrAIN Labs',
      approval_status: 'APPROVED',
      created_by_researcher: researcherId,
      approved_by_admin_id: adminId
    });
    if (error) console.error("Event Error:", error.message);
  }

  // Insert grants
  console.log("Seeding Grants...");
  for (const g of grants) {
    const { error } = await supabase.from('grant_info').insert({
      title: g.title,
      description: g.description,
      passed_date: '2025-01-01',
      expire_date: '2026-01-01',
      approval_status: 'APPROVED',
      created_by_researcher: researcherId,
      approved_by_admin_id: adminId
    });
    if (error) console.error("Grant Error:", error.message);
  }

  // Insert projects
  console.log("Seeding Projects...");
  for (const cat of projects) {
    for (const proj of cat.items) {
      const { error } = await supabase.from('project').insert({
        title: proj.title,
        description: proj.description,
        approval_status: 'APPROVED',
        created_by_member_id: researcherId,
        approved_by_admin_id: adminId
      });
      if (error) console.error("Project Error:", error.message);
    }
  }

  // Insert publications
  console.log("Seeding Publications...");
  for (const pub of publications) {
    const { data: p, error } = await supabase.from('publication').insert({
      title: pub.title,
      approval_status: 'APPROVED',
      created_by_member_id: researcherId,
      approved_by_admin_id: adminId
    }).select().single();
    
    if (error) { console.error("Publication Error:", error.message); continue; }
    
    await supabase.from('journal').insert({
      publication_id: p.id,
      link: pub.link || '',
      description: pub.authors + " | " + pub.venue
    });
  }

  console.log("Seeding Database Completed Successfully!");
}

seed().catch(console.error);
