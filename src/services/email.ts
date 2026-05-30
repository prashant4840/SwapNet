import { supabase } from '@/lib/supabase'
import { captureException } from './errorTracking'

export interface EmailPayload {
  type: 'welcome' | 'swap_request_received' | 'swap_request_accepted' | 'new_message' | 'review_received'
  toEmail: string
  toName: string
  [key: string]: unknown
}

async function triggerEmailEdgeFunction(payload: EmailPayload): Promise<boolean> {
  if (!supabase) {
    console.warn('[Email Service] Supabase not configured. Email suppressed:', payload)
    return false
  }

  try {
    // 1. Insert into database email_queue to ensure durability and retry-ability
    const { data: queueData, error: queueError } = await supabase
      .from('email_queue')
      .insert({
        to_email: payload.toEmail,
        to_name: payload.toName,
        type: payload.type,
        payload: payload,
        status: 'pending',
      })
      .select('id')
      .single()

    if (queueError) {
      throw queueError
    }

    const queueId = queueData?.id

    if (queueId) {
      // 2. Dispatch background request to process this queue entry immediately
      void supabase.functions.invoke('send-email', {
        body: { queueId },
      }).then(({ data, error }) => {
        if (error) {
          console.error('[Email Service] Async trigger error for queueId:', queueId, error)
        } else {
          console.log('[Email Service] Async trigger success for queueId:', queueId, data)
        }
      })
    }

    return true
  } catch (err) {
    console.error('[Email Service] Queue insertion failed, falling back to direct invocation:', err)
    captureException(err, { service: 'email-trigger-fallback', type: payload.type })
    
    // Direct legacy invocation fallback to protect core transaction
    void supabase.functions.invoke('send-email', {
      body: payload,
    }).catch((fallbackErr) => {
      console.error('[Email Service] Direct fallback invocation failed:', fallbackErr)
    })
    return false
  }
}


export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  return triggerEmailEdgeFunction({
    type: 'welcome',
    toEmail: email,
    toName: name,
  })
}

export async function sendSwapRequestReceivedEmail(params: {
  receiverEmail: string
  receiverName: string
  senderName: string
  skillOffered: string
  skillWanted: string
}): Promise<boolean> {
  return triggerEmailEdgeFunction({
    type: 'swap_request_received',
    toEmail: params.receiverEmail,
    toName: params.receiverName,
    senderName: params.senderName,
    skillOffered: params.skillOffered,
    skillWanted: params.skillWanted,
  })
}

export async function sendSwapRequestAcceptedEmail(params: {
  receiverEmail: string
  receiverName: string
  senderName: string
}): Promise<boolean> {
  return triggerEmailEdgeFunction({
    type: 'swap_request_accepted',
    toEmail: params.receiverEmail,
    toName: params.receiverName,
    senderName: params.senderName,
  })
}

export async function sendNewMessageEmail(params: {
  receiverEmail: string
  receiverName: string
  senderName: string
  messageSnippet: string
}): Promise<boolean> {
  return triggerEmailEdgeFunction({
    type: 'new_message',
    toEmail: params.receiverEmail,
    toName: params.receiverName,
    senderName: params.senderName,
    messageSnippet: params.messageSnippet,
  })
}

export async function sendReviewReceivedEmail(params: {
  receiverEmail: string
  receiverName: string
  reviewerName: string
  rating: number
  comment: string
}): Promise<boolean> {
  return triggerEmailEdgeFunction({
    type: 'review_received',
    toEmail: params.receiverEmail,
    toName: params.receiverName,
    reviewerName: params.reviewerName,
    rating: params.rating,
    comment: params.comment,
  })
}
