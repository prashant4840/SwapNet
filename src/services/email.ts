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
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: payload,
    })

    if (error) {
      throw error
    }

    console.log('[Email Service] Email successfully triggered:', payload.type, data)
    return true
  } catch (err) {
    captureException(err, { service: 'email-trigger', type: payload.type })
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
