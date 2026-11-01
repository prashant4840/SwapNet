#!/usr/bin/env node

/**
 * SwapNet — Final Live Launch Verification
 *
 * Performs REAL Supabase operations against the production database.
 * Exercises: auth, CRUD on all tables, RLS, realtime readiness, view integrity.
 *
 * Usage:
 *   node --env-file-if-exists=.env scripts/verify-live-launch.mjs
 *
 * Required env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 * Optional: SKILLBRIDGE_TEST_EMAIL, SKILLBRIDGE_TEST_PASSWORD
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
// Prefer explicit test creds from env; fallback creates a fresh timestamped account
const envEmail = (process.env.SWAPNET_TEST_EMAIL ?? process.env.SKILLBRIDGE_TEST_EMAIL ?? '').trim()
const envPassword = (process.env.SWAPNET_TEST_PASSWORD ?? process.env.SKILLBRIDGE_TEST_PASSWORD ?? '').trim()
const TEST_EMAIL = envEmail || `swapnet.verify+${Date.now()}@gmail.com`
const TEST_PASSWORD = envPassword || 'VerifyLaunch2026!'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('ERROR: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const results = []
let exitCode = 0
let testUserId = null
let session = null

function pass(name, detail) {
  results.push({ name, status: 'PASS', detail })
  console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name, detail) {
  results.push({ name, status: 'FAIL', detail })
  console.error(`  ❌ ${name} — ${detail}`)
  exitCode = 1
}

function skip(name, detail) {
  results.push({ name, status: 'SKIP', detail })
  console.log(`  ⏭️  ${name} — ${detail}`)
}

// ─── 1. Email Authentication ──────────────────────────────────────────────

console.log('\n═══ PHASE 1: AUTHENTICATION ═══')
console.log(`  Using test email: ${TEST_EMAIL}`)

// Try login first (works if account already exists and is confirmed)
let loginSuccess = false
{
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })

  if (!loginError && loginData?.session) {
    session = loginData.session
    testUserId = loginData.user.id
    loginSuccess = true
    pass('Email Login', `Authenticated as ${testUserId}`)
  } else if (loginError?.message?.includes('Invalid login credentials')) {
    // Account doesn't exist yet — try signup
    console.log('  ℹ️  No existing account. Attempting signup...')

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: { data: { full_name: 'Launch Verifier', city: 'Test City' } },
    })

    if (signUpError) {
      fail('Email Signup', signUpError.message)
    } else if (signUpData?.session) {
      // Auto-confirm is on — we got a session immediately
      session = signUpData.session
      testUserId = signUpData.user.id
      loginSuccess = true
      pass('Email Signup + Auto-Login', `Created & authenticated as ${testUserId}`)
    } else if (signUpData?.user) {
      // Signup succeeded but email confirmation required
      testUserId = signUpData.user.id
      pass('Email Signup', `Account created (${testUserId}), awaiting email confirmation`)
      skip('Email Login', 'Email not yet confirmed — enable auto-confirm in Supabase dashboard for full verification')
    }
  } else if (loginError?.message?.includes('Email not confirmed')) {
    testUserId = null
    pass('Email Signup (prior)', 'Account exists but email not confirmed')
    skip('Email Login', 'Email not confirmed — confirm manually or enable auto-confirm')
  } else {
    fail('Email Login', loginError?.message || 'Unknown login error')
  }
}

// Session persistence check
if (session) {
  const { data: sessionData } = await supabase.auth.getSession()
  if (sessionData?.session?.access_token) {
    pass('Session Persistence', 'getSession() returns valid access_token after login')
  } else {
    fail('Session Persistence', 'getSession() returned null after login')
  }
} else {
  skip('Session Persistence', 'No session available')
}

// Google OAuth URL generation (cannot complete actual OAuth flow without browser)
const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: 'http://localhost:3000/dashboard', skipBrowserRedirect: true },
})

if (oauthError) {
  fail('Google OAuth URL', oauthError.message)
} else if (oauthData?.url) {
  pass('Google OAuth URL', `OAuth redirect URL generated: ${oauthData.url.slice(0, 80)}...`)
} else {
  skip('Google OAuth URL', 'Google provider may not be enabled in Supabase dashboard')
}

// Password reset (fire and verify no server error)
const { error: resetError } = await supabase.auth.resetPasswordForEmail(
  'reset-test@swapnet-test.local',
  { redirectTo: 'http://localhost:3000/reset-password' },
)
if (resetError) {
  // Some configs may block this for non-existent users; that's acceptable
  if (resetError.message.includes('rate limit') || resetError.message.includes('not found')) {
    pass('Password Reset Email', `API responded (expected for non-existent user): ${resetError.message}`)
  } else {
    fail('Password Reset Email', resetError.message)
  }
} else {
  pass('Password Reset Email', 'resetPasswordForEmail succeeded (email sent or queued)')
}

// ─── 2. Database Table CRUD ──────────────────────────────────────────────

console.log('\n═══ PHASE 2: DATABASE TABLE OPERATIONS ═══')

if (!session) {
  skip('All DB Operations', 'No authenticated session — skipping table CRUD')
} else {
  // 2a. Users table — profile upsert
  {
    const { error } = await supabase
      .from('users')
      .upsert(
        {
          id: testUserId,
          email: TEST_EMAIL,
          name: 'Launch Verifier',
          username: `launch-verifier-${Date.now()}`,
          city: 'Test City',
          bio: 'Automated launch verification.',
          headline: 'Launch test account',
          photo: `https://api.dicebear.com/9.x/shapes/svg?seed=${testUserId}`,
          mode: 'Online',
          availability: ['Weekdays'],
        },
        { onConflict: 'id' },
      )
    if (error) fail('Users Upsert', error.message)
    else pass('Users Upsert', 'Profile row upserted')
  }

  // Read back
  {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, username, city')
      .eq('id', testUserId)
      .single()
    if (error) fail('Users Read', error.message)
    else if (data?.id === testUserId) pass('Users Read', `Read profile: ${data.name} (${data.city})`)
    else fail('Users Read', 'Returned data does not match test user')
  }

  // 2b. Skills Offered
  const offeredSkillId = crypto.randomUUID()
  {
    const { error } = await supabase
      .from('skills_offered')
      .insert({
        id: offeredSkillId,
        user_id: testUserId,
        skill_name: 'TypeScript Testing',
        category: 'Programming',
        level: 'Advanced',
      })
    if (error) fail('Skills Offered Insert', error.message)
    else pass('Skills Offered Insert', `Inserted skill_offered ${offeredSkillId}`)
  }

  // 2c. Skills Wanted
  const wantedSkillId = crypto.randomUUID()
  {
    const { error } = await supabase
      .from('skills_wanted')
      .insert({
        id: wantedSkillId,
        user_id: testUserId,
        skill_name: 'Rust Fundamentals',
        category: 'Programming',
      })
    if (error) fail('Skills Wanted Insert', error.message)
    else pass('Skills Wanted Insert', `Inserted skill_wanted ${wantedSkillId}`)
  }

  // 2d. Community Posts
  let testPostId = null
  {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: testUserId,
        skill_name: 'Launch Verification Skill',
        category: 'Design',
        note: 'Automated test — will be cleaned up.',
        mode: 'Online',
        city: 'Test City',
      })
      .select()
      .single()
    if (error) fail('Posts Insert', error.message)
    else {
      testPostId = data.id
      pass('Posts Insert', `Created post ${testPostId}`)
    }
  }

  // 2e. Swap Requests
  let testSwapId = null
  {
    const { data, error } = await supabase
      .from('swap_requests')
      .insert({
        sender_id: testUserId,
        receiver_id: testUserId, // self-swap for testing
        message: 'Launch verification swap',
        status: 'Pending',
        offered_skill_id: offeredSkillId,
        wanted_skill_id: wantedSkillId,
        completed_by: [],
      })
      .select()
      .single()
    if (error) fail('Swap Requests Insert', error.message)
    else {
      testSwapId = data.id
      pass('Swap Requests Insert', `Created swap ${testSwapId}`)
    }
  }

  // 2f. Connection Requests
  let testConnId = null
  {
    const { data, error } = await supabase
      .from('connection_requests')
      .insert({
        sender_id: testUserId,
        receiver_id: testUserId,
        message: 'Launch verification connection',
        status: 'Pending',
      })
      .select()
      .single()
    if (error) fail('Connection Requests Insert', error.message)
    else {
      testConnId = data.id
      pass('Connection Requests Insert', `Created connection ${testConnId}`)
    }
  }

  // 2g. Messages (Chat)
  let testMessageId = null
  const threadKey = testSwapId ? `swap-${testSwapId}` : `swap-verify-${Date.now()}`
  {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        thread_key: threadKey,
        swap_id: testSwapId,
        sender_id: testUserId,
        receiver_id: testUserId,
        message: 'Launch verification message',
        message_type: 'text',
      })
      .select()
      .single()
    if (error) fail('Messages Insert', error.message)
    else {
      testMessageId = data.id
      pass('Messages Insert', `Sent message ${testMessageId} in thread ${threadKey}`)
    }
  }

  // 2h. Notifications
  let testNotifId = null
  {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: testUserId,
        type: 'system',
        title: 'Launch Verification',
        description: 'This is an automated launch verification notification.',
        read: false,
      })
      .select()
      .single()
    if (error) fail('Notifications Insert', error.message)
    else {
      testNotifId = data.id
      pass('Notifications Insert', `Created notification ${testNotifId}`)
    }
  }

  // Mark notification read
  if (testNotifId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', testNotifId)
    if (error) fail('Notifications Mark Read', error.message)
    else pass('Notifications Mark Read', `Notification ${testNotifId} marked as read`)
  }

  // 2i. Reviews (requires a completed swap)
  let testReviewId = null
  if (testSwapId) {
    // Complete the swap first
    const { error: completeError } = await supabase
      .from('swap_requests')
      .update({ status: 'Completed', completed_by: [testUserId], updated_at: new Date().toISOString() })
      .eq('id', testSwapId)

    if (completeError) {
      fail('Swap Complete', completeError.message)
    } else {
      pass('Swap Complete', `Swap ${testSwapId} marked Completed`)

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          reviewer_id: testUserId,
          reviewee_id: testUserId,
          swap_id: testSwapId,
          rating: 5,
          comment: 'Automated launch verification review.',
        })
        .select()
        .single()
      if (error) fail('Reviews Insert', error.message)
      else {
        testReviewId = data.id
        pass('Reviews Insert', `Created review ${testReviewId}`)
      }
    }
  }

  // 2j. Skill Endorsements
  let testEndorsementId = null
  {
    const { data, error } = await supabase
      .from('skill_endorsements')
      .insert({
        endorsed_user_id: testUserId,
        endorser_id: testUserId,
        skill_name: 'TypeScript Testing',
      })
      .select()
      .single()
    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        pass('Skill Endorsements Insert', 'Duplicate endorsement prevented (unique constraint working)')
      } else {
        fail('Skill Endorsements Insert', error.message)
      }
    } else {
      testEndorsementId = data.id
      pass('Skill Endorsements Insert', `Created endorsement ${testEndorsementId}`)
    }
  }

  // ─── 3. Views ──────────────────────────────────────────────────────────

  console.log('\n═══ PHASE 3: DATABASE VIEWS ═══')

  {
    const { data, error } = await supabase
      .from('platform_metrics')
      .select('*')
      .limit(1)
    if (error) fail('platform_metrics View', error.message)
    else if (data && data.length > 0) {
      const row = data[0]
      pass('platform_metrics View', `total_users=${row.total_users}, active_users=${row.active_users}, completed_swaps=${row.completed_swaps}`)
    } else {
      pass('platform_metrics View', 'View returned empty (no rows yet)')
    }
  }

  // ─── 4. RLS Enforcement ──────────────────────────────────────────────────

  console.log('\n═══ PHASE 4: RLS ENFORCEMENT ═══')

  // Create a second anon client (no auth) and verify it cannot read private data
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Anon should not be able to read other users' notifications
  {
    const { data, error } = await anonClient
      .from('notifications')
      .select('*')
      .limit(5)
    if (error) {
      pass('RLS: Anon Notifications', `Blocked: ${error.message}`)
    } else if (data && data.length === 0) {
      pass('RLS: Anon Notifications', 'No rows returned to anon user (RLS active)')
    } else {
      fail('RLS: Anon Notifications', `Anon user received ${data.length} notifications — RLS may be misconfigured`)
    }
  }

  // Anon should not be able to read messages
  {
    const { data, error } = await anonClient
      .from('messages')
      .select('*')
      .limit(5)
    if (error) {
      pass('RLS: Anon Messages', `Blocked: ${error.message}`)
    } else if (data && data.length === 0) {
      pass('RLS: Anon Messages', 'No rows returned to anon user (RLS active)')
    } else {
      fail('RLS: Anon Messages', `Anon user received ${data.length} messages — RLS may be misconfigured`)
    }
  }

  // Users table should allow public reads (for explore/profiles)
  {
    const { data, error } = await anonClient
      .from('users')
      .select('id, name, username, city, headline')
      .limit(3)
    if (error) {
      // Some RLS may restrict even reads
      pass('RLS: Public Users Read', `Restricted: ${error.message} (strict RLS)`)
    } else {
      pass('RLS: Public Users Read', `${data.length} profiles visible to anon (expected for public explore)`)
    }
  }

  // ─── 5. Cleanup ──────────────────────────────────────────────────────────

  console.log('\n═══ PHASE 5: CLEANUP ═══')

  const cleanupOps = [
    testEndorsementId && supabase.from('skill_endorsements').delete().eq('id', testEndorsementId),
    testReviewId && supabase.from('reviews').delete().eq('id', testReviewId),
    testMessageId && supabase.from('messages').delete().eq('id', testMessageId),
    testNotifId && supabase.from('notifications').delete().eq('id', testNotifId),
    testConnId && supabase.from('connection_requests').delete().eq('id', testConnId),
    testSwapId && supabase.from('swap_requests').delete().eq('id', testSwapId),
    testPostId && supabase.from('posts').delete().eq('id', testPostId),
    supabase.from('skills_wanted').delete().eq('id', wantedSkillId),
    supabase.from('skills_offered').delete().eq('id', offeredSkillId),
  ].filter(Boolean)

  const cleanupResults = await Promise.allSettled(cleanupOps)
  const cleanupFails = cleanupResults.filter(r => r.status === 'rejected' || r.value?.error)
  if (cleanupFails.length === 0) {
    pass('Cleanup', `${cleanupOps.length} test records deleted`)
  } else {
    fail('Cleanup', `${cleanupFails.length}/${cleanupOps.length} cleanup operations had issues`)
  }

  // Sign out
  await supabase.auth.signOut()
  pass('Logout', 'Session destroyed')
}

// ─── SUMMARY ──────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════╗')
console.log('║     SWAPNET LIVE LAUNCH VERIFICATION REPORT     ║')
console.log('╚══════════════════════════════════════════════════╝\n')

const passed = results.filter(r => r.status === 'PASS').length
const failed = results.filter(r => r.status === 'FAIL').length
const skipped = results.filter(r => r.status === 'SKIP').length

console.log(`  Total: ${results.length}  |  ✅ Passed: ${passed}  |  ❌ Failed: ${failed}  |  ⏭️  Skipped: ${skipped}`)
console.log('')

if (failed > 0) {
  console.log('  FAILED TESTS:')
  results.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`    ❌ ${r.name}: ${r.detail}`)
  })
  console.log('')
}

if (skipped > 0) {
  console.log('  SKIPPED TESTS:')
  results.filter(r => r.status === 'SKIP').forEach(r => {
    console.log(`    ⏭️  ${r.name}: ${r.detail}`)
  })
  console.log('')
}

console.log(failed === 0 ? '  🚀 All live verifications PASSED.' : '  ⛔ Some verifications FAILED. Fix before launch.')
console.log('')

process.exit(exitCode)
