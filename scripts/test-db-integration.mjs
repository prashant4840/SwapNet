import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const envContent = fs.readFileSync('.env', 'utf-8')
const env = {}
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = env['VITE_SUPABASE_URL']
const supabaseKey = env['VITE_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
  console.log('Testing live Supabase database operations across all tables...')
  const results = {}

  // 1. User profiles
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, name, email, photo, city, bio, headline, mode, rating, skills_offered(*), skills_wanted(*)')
      .limit(3)
    results.users = { ok: !error, count: data?.length, sampleUser: data?.[0]?.name, error: error?.message }
  } catch (err) {
    results.users = { ok: false, error: err.message }
  }

  // 2. Skills offered and wanted
  try {
    const { data: offered, error: offErr } = await supabase.from('skills_offered').select('id, user_id, skill_name, category, level').limit(3)
    const { data: wanted, error: wantErr } = await supabase.from('skills_wanted').select('id, user_id, skill_name, category').limit(3)
    results.skills_offered = { ok: !offErr, count: offered?.length, error: offErr?.message }
    results.skills_wanted = { ok: !wantErr, count: wanted?.length, error: wantErr?.message }
  } catch (err) {
    results.skills = { ok: false, error: err.message }
  }

  // 3. Swap requests
  try {
    const { data, error } = await supabase
      .from('swap_requests')
      .select('id, sender_id, receiver_id, message, offered_skill_id, wanted_skill_id, status, created_at')
      .limit(3)
    results.swap_requests = { ok: !error, count: data?.length, error: error?.message }
  } catch (err) {
    results.swap_requests = { ok: false, error: err.message }
  }

  // 4. Connection requests
  try {
    const { data, error } = await supabase
      .from('connection_requests')
      .select('id, sender_id, receiver_id, message, status, created_at')
      .limit(3)
    results.connection_requests = { ok: !error, count: data?.length, error: error?.message }
  } catch (err) {
    results.connection_requests = { ok: false, error: err.message }
  }

  // 5. Chat messages
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id, thread_key, sender_id, receiver_id, swap_id, connection_request_id, message, message_type, created_at')
      .limit(3)
    results.messages = { ok: !error, count: data?.length, error: error?.message }
  } catch (err) {
    results.messages = { ok: false, error: err.message }
  }

  // 6. Community posts (posts table)
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, user_id, skill_name, category, note, city, mode, responses, created_at')
      .limit(3)
    results.posts = { ok: !error, count: data?.length, error: error?.message }
  } catch (err) {
    results.posts = { ok: false, error: err.message }
  }

  // 7. Reviews
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, reviewer_id, reviewee_id, swap_id, rating, comment, created_at')
      .limit(3)
    results.reviews = { ok: !error, count: data?.length, error: error?.message }
  } catch (err) {
    results.reviews = { ok: false, error: err.message }
  }

  // 8. Notifications
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, description, link, read, created_at')
      .limit(3)
    results.notifications = { ok: !error, count: data?.length, error: error?.message }
  } catch (err) {
    results.notifications = { ok: false, error: err.message }
  }

  // 9. Skill Endorsements
  try {
    const { data, error } = await supabase
      .from('skill_endorsements')
      .select('id, endorser_id, endorsed_user_id, swap_request_id, skill_name, created_at')
      .limit(3)
    results.skill_endorsements = { ok: !error, count: data?.length, error: error?.message }
  } catch (err) {
    results.skill_endorsements = { ok: false, error: err.message }
  }

  // 10. Platform metrics view
  try {
    const { data, error } = await supabase.from('platform_metrics').select('*')
    results.platform_metrics = { ok: !error, data: data?.[0], error: error?.message }
  } catch (err) {
    results.platform_metrics = { ok: false, error: err.message }
  }

  console.log(JSON.stringify(results, null, 2))
}

testDatabase()
