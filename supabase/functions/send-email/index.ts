import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const BASE_URL = 'https://skillbridge-mu-green.vercel.app' // Vercel deployment URL

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

serve(async (req) => {
  // CORS check
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const payload: EmailRequest = await req.json()
    const { type, toEmail, toName } = payload

    if (!toEmail || !toName || !type) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

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
      return new Response(JSON.stringify({ error: 'Unsupported template type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    if (!RESEND_API_KEY) {
      console.warn('[Resend] Warning: RESEND_API_KEY is not set. Simulating success output.')
      return new Response(JSON.stringify({ success: true, mocked: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
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
      console.error('[Resend Edge Function Error]:', errorMsg)
      return new Response(JSON.stringify({ error: 'Failed to deliver email' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const resData = await response.json()
    return new Response(JSON.stringify({ success: true, data: resData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error) {
    console.error('[Edge Function Catch Error]:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
