import { inject } from '@vercel/analytics'
import { captureException } from './errorTracking'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST as string | 'https://app.posthog.com'
const IS_PROD = import.meta.env.PROD

let isVercelAnalyticsInjected = false

export function initAnalytics() {
  if (IS_PROD) {
    try {
      if (!isVercelAnalyticsInjected) {
        inject()
        isVercelAnalyticsInjected = true
        console.log('[Analytics] Vercel Analytics initialized.')
      }
    } catch (err) {
      captureException(err, { service: 'analytics-init' })
    }
  } else {
    console.log('[Analytics] Sandbox mode. Tracking logged to console.')
  }
}

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  console.log(`[Analytics Event - ${eventName}]:`, properties)

  if (IS_PROD && POSTHOG_KEY) {
    // Fire-and-forget raw HTTP event tracking to avoid PostHog SDK bundle bloat
    void fetch(`${POSTHOG_HOST}/decide/?v=2`, {
      method: 'POST',
      body: JSON.stringify({ api_key: POSTHOG_KEY, distinct_id: properties?.userId || 'anonymous' }),
    }).then(() => {
      return fetch(`${POSTHOG_HOST}/capture/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: POSTHOG_KEY,
          event: eventName,
          properties: {
            distinct_id: properties?.userId || 'anonymous',
            ...properties,
            timestamp: new Date().toISOString(),
          },
        }),
      })
    }).catch((err) => {
      captureException(err, { eventName, properties })
    })
  }
}

export function trackPageView(path: string) {
  trackEvent('$pageview', { path })
}

export function trackSignup(userId: string, email: string) {
  trackEvent('user_signup', { userId, email })
}

export function trackProfileCompleted(userId: string, username: string) {
  trackEvent('profile_completed', { userId, username })
}

export function trackSwapRequest(senderId: string, receiverId: string, offerSkill: string, wantedSkill: string) {
  trackEvent('swap_request_sent', { userId: senderId, receiverId, offerSkill, wantedSkill })
}

export function trackSwapAccepted(swapId: string, senderId: string, receiverId: string) {
  trackEvent('swap_request_accepted', { swapId, userId: receiverId, senderId })
}

export function trackMessageSent(senderId: string, receiverId: string, threadId: string) {
  trackEvent('message_sent', { userId: senderId, receiverId, threadId })
}

export function trackReviewSubmitted(reviewerId: string, revieweeId: string, swapId: string, rating: number) {
  trackEvent('review_submitted', { userId: reviewerId, revieweeId, swapId, rating })
}
