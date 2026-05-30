/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.14.0'
import { z } from 'https://esm.sh/zod@3.21.4'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const BASE_URL = 'https://skillbridge-mu-green.vercel.app' // Vercel deployment URL

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// Zod schema validation for request payloads
const emailRequestSchema = z.object({
  queueId: z.string().uuid().optional(),
  action: z.string().optional(),
  type: z.enum(['welcome', 'swap_request_received', 'swap_request_accepted', 'new_message', 'review_received']).optional(),
  toEmail: z.string().email().optional(),
  toName: z.string().min(1).optional(),
  senderName: z.string().optional(),
  skillOffered: z.string().optional(),
  skillWanted: z.string().optional(),
  messageSnippet: z.string().optional(),
  reviewerName: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
})

interface EmailRequest {
  type: 'welcome' | 'swap_request_received' | 'swap_request_accepted' | 'new_message' | 'review_received'
  toEmail: string
  toName: string
  senderName?: string
  skillOffered?: string
  skillWanted?: string
  messageSnippet?: string
  reviewerName?: string
  rating?: number
  comment?: string
}

function getHtmlTemplate(title: string, bodyContent: string, ctaUrl?: string, ctaText?: string): string {
  const ctaButtonHtml = ctaUrl && ctaText
    ? `
      <div style="margin: 32px 0; text-align: center;">
        <a href="${ctaUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; font-weight: 600; text-decoration: none; border-radius: 12px; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15); transition: background-color 0.2s ease;">
          ${ctaText}
        </a>
      </div>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @media (prefers-color-scheme: dark) {
          body { background-color: #0f172a !important; color: #cbd5e1 !important; }
          .card { background-color: #1e293b !important; border-color: #334155 !important; }
          .text-muted { color: #94a3b8 !important; }
          .header { border-bottom-color: #334155 !important; }
          .logo { color: #f8fafc !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
      <div style="max-width: 600px; margin: 40px auto; padding: 0 16px;">
        <div class="card" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <div class="header" style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between;">
            <span class="logo" style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.025em;">Swap<span style="color: #4f46e5;">Net</span></span>
          </div>
          <!-- Body -->
          <div style="padding: 32px;">
            ${bodyContent}
            ${ctaButtonHtml}
            <p class="text-muted" style="margin-top: 32px; font-size: 13px; color: #64748b; line-height: 1.6;">
              Best regards,<br>
              <strong>The SwapNet Team</strong>
            </p>
          </div>
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">
              &copy; ${new Date().getFullYear()} SwapNet. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `.trim()
}

async function sendMailViaResend(payload: EmailRequest): Promise<boolean> {
  const { type, toEmail, toName } = payload
  let subject = ''
  let htmlContent = ''

  if (type === 'welcome') {
    subject = 'Welcome to SwapNet! 🚀'
    const body = `
      <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px 0; color: #0f172a;">Welcome to SwapNet, ${toName}!</h1>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">We're thrilled to have you join our reciprocal skill-sharing community. Teach what you know, learn what you don't &mdash; completely free.</p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">To get started, follow these simple steps:</p>
      <ol style="font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Shape your public profile with your skills offered and wanted.</li>
        <li style="margin-bottom: 8px;">Browse the Explore tab to find compatible community members.</li>
        <li style="margin-bottom: 8px;">Send a connection or swap request to start collaborating.</li>
      </ol>
    `
    htmlContent = getHtmlTemplate(subject, body, `${BASE_URL}/settings`, 'Complete Your Profile')
  } else if (type === 'swap_request_received') {
    const { senderName, skillOffered, skillWanted } = payload
    subject = `${senderName} wants to swap skills with you!`
    const body = `
      <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px 0; color: #0f172a;">New Swap Request</h1>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${toName},</p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;"><strong>${senderName}</strong> wants to connect and swap skills with you!</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Offering:</strong> ${skillOffered || 'a skill'}</p>
        <p style="margin: 0; font-size: 14px;"><strong>Wants:</strong> ${skillWanted || 'a skill'}</p>
      </div>
    `
    htmlContent = getHtmlTemplate(subject, body, `${BASE_URL}/dashboard`, 'Respond to Swap Request')
  } else if (type === 'swap_request_accepted') {
    const { senderName } = payload
    subject = `${senderName} accepted your skill swap request!`
    const body = `
      <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px 0; color: #0f172a;">Swap Request Accepted! 🎉</h1>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${toName},</p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Great news! <strong>${senderName}</strong> accepted your skill swap request. You can now chat to align on availability and plan your sessions.</p>
    `
    htmlContent = getHtmlTemplate(subject, body, `${BASE_URL}/messages`, 'Open Messages & Chat')
  } else if (type === 'new_message') {
    const { senderName, messageSnippet } = payload
    subject = `New message from ${senderName}`
    const body = `
      <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px 0; color: #0f172a;">New Message Received</h1>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${toName},</p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">You have received a new message from <strong>${senderName}</strong>:</p>
      <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 16px; border-radius: 12px; margin-bottom: 24px; font-style: italic; color: #475569;">
        "${messageSnippet}"
      </div>
    `
    htmlContent = getHtmlTemplate(subject, body, `${BASE_URL}/messages`, 'Reply to Message')
  } else if (type === 'review_received') {
    const { reviewerName, rating, comment } = payload
    subject = `${reviewerName} reviewed your skill swap!`
    const starString = '★'.repeat(Number(rating) || 5) + '☆'.repeat(5 - (Number(rating) || 5))
    const body = `
      <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px 0; color: #0f172a;">Review Received</h1>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${toName},</p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;"><strong>${reviewerName}</strong> reviewed their skill swap with you:</p>
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 16px; border-radius: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; font-size: 16px; color: #d97706; font-weight: bold;">Rating: ${starString}</p>
        <p style="margin: 0; font-size: 14px; color: #78350f;">"${comment}"</p>
      </div>
    `
    htmlContent = getHtmlTemplate(subject, body, `${BASE_URL}/dashboard`, 'View Your Reputation')
  } else {
    throw new Error('Unsupported template type')
  }

  if (!RESEND_API_KEY) {
    console.warn('[Resend] WARNING: RESEND_API_KEY is not set. Simulating successful send.')
    return true
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'SwapNet <onboarding@resend.dev>',
      to: toEmail,
      subject: subject,
      html: htmlContent,
    }),
  })

  if (!response.ok) {
    const errorMsg = await response.text()
    throw new Error(`Resend API Error: ${errorMsg}`)
  }

  return true
}

async function processQueueItem(supabaseAdmin: any, item: any) {
  try {
    const emailPayload: EmailRequest = item.payload
    await sendMailViaResend(emailPayload)

    // Update status to sent
    await supabaseAdmin
      .from('email_queue')
      .update({
        status: 'sent',
        last_error: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id)

    return { id: item.id, success: true }
  } catch (err) {
    console.error(`[Process Queue Item Error] ID: ${item.id}:`, err)
    
    const retryCount = item.retry_count + 1
    const maxRetries = 5
    const nextStatus = retryCount >= maxRetries ? 'failed' : 'retrying'
    
    // Exponential backoff: 2, 4, 8, 16, 32 minutes
    const backoffMinutes = Math.pow(2, retryCount)
    const scheduledAt = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString()

    await supabaseAdmin
      .from('email_queue')
      .update({
        status: nextStatus,
        retry_count: retryCount,
        last_error: err.message || String(err),
        updated_at: new Date().toISOString(),
        scheduled_at: scheduledAt
      })
      .eq('id', item.id)

    return { id: item.id, success: false, error: err.message }
  }
}

serve(async (req) => {
  // CORS checks
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // ── Phase 3: JWT Authentication & Authorization Verification ──
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const isServiceRole = token === SUPABASE_SERVICE_ROLE_KEY
    
    // Instantiate Admin Client (bypasses RLS to query and manage queue)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Verify token validity if not service role
    if (!isServiceRole) {
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }
    }

    // ── Parse & Validate Request Body ──
    const rawBody = await req.json()
    const parsedBody = emailRequestSchema.parse(rawBody)

    // ── Direct Queue Processing by ID ──
    if (parsedBody.queueId) {
      const { data: queueItem, error: fetchError } = await supabaseAdmin
        .from('email_queue')
        .select('*')
        .eq('id', parsedBody.queueId)
        .single()

      if (fetchError || !queueItem) {
        return new Response(JSON.stringify({ error: 'Queue item not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }

      if (queueItem.status === 'sent') {
        return new Response(JSON.stringify({ success: true, message: 'Already sent' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }

      const result = await processQueueItem(supabaseAdmin, queueItem)
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // ── Periodic Process All Outstanding Queued Emails ──
    if (parsedBody.action === 'process_queue') {
      const { data: pendingItems, error: fetchError } = await supabaseAdmin
        .from('email_queue')
        .select('*')
        .in('status', ['pending', 'retrying'])
        .lte('scheduled_at', new Date().toISOString())
        .order('created_at', { ascending: true })
        .limit(20)

      if (fetchError) {
        throw fetchError
      }

      if (!pendingItems || pendingItems.length === 0) {
        return new Response(JSON.stringify({ success: true, processed: 0 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }

      const results = await Promise.all(
        pendingItems.map((item) => processQueueItem(supabaseAdmin, item))
      )

      return new Response(JSON.stringify({ success: true, results }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // ── Fallback Direct Email Sending (with Zod schema checks) ──
    if (parsedBody.type && parsedBody.toEmail && parsedBody.toName) {
      const emailPayload: EmailRequest = {
        type: parsedBody.type,
        toEmail: parsedBody.toEmail,
        toName: parsedBody.toName,
        senderName: parsedBody.senderName,
        skillOffered: parsedBody.skillOffered,
        skillWanted: parsedBody.skillWanted,
        messageSnippet: parsedBody.messageSnippet,
        reviewerName: parsedBody.reviewerName,
        rating: parsedBody.rating,
        comment: parsedBody.comment,
      }

      await sendMailViaResend(emailPayload)
      return new Response(JSON.stringify({ success: true, message: 'Direct email sent successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid parameters: Provide queueId, action="process_queue" or complete email details' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })

  } catch (error) {
    console.error('[Edge Function Catch Error]:', error)
    const status = error instanceof z.ZodError ? 400 : 500
    const msg = error instanceof z.ZodError ? error.errors : error.message
    
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
