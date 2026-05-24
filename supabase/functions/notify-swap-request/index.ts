import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const { receiverEmail, receiverName, senderName, skillOffered, skillWanted } = await req.json()

    if (!receiverEmail || !senderName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const emailBody = `
Hi ${receiverName},

${senderName} wants to swap skills with you on SwapNet!

They're offering: ${skillOffered || 'a skill'}
They want to learn: ${skillWanted || 'a skill'}

Log in to SwapNet to accept or decline:
https://skillbridge-mu-green.vercel.app/dashboard

The SwapNet Team
    `.trim()

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SwapNet <onboarding@resend.dev>',
        to: receiverEmail,
        subject: `${senderName} wants to swap skills with you`,
        text: emailBody,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend error:', error)
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})