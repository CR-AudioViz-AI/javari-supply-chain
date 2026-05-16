// lib/platform-sdk.ts
// ─────────────────────────────────────────────────────────────────────────────
// Javari Platform SDK — Standard integration for ALL apps
// Every app imports this to get: OAuth, payments, credits, AI, user management
//
// Pattern:
//   import { PlatformSDK } from '@/lib/platform-sdk'
//   const sdk = new PlatformSDK()
//   const user = await sdk.auth.getUser(req)
//   await sdk.credits.spend(user.id, 5, 'resume_generation')
//
// craudiovizai.com handles ALL backend logic — apps are just thin clients
// Created: May 15, 2026
// ─────────────────────────────────────────────────────────────────────────────

const PLATFORM_URL = process.env.NEXT_PUBLIC_CENTRAL_API_URL
  ?? process.env.PLATFORM_URL
  ?? 'https://craudiovizai.com'

const PLATFORM_KEY = process.env.PLATFORM_API_KEY ?? ''

// ─────────────────────────────────────────────────────────────────────────────
// Core platform fetch — authenticated to craudiovizai.com
// ─────────────────────────────────────────────────────────────────────────────

async function platformFetch(
  endpoint:   string,
  options:    RequestInit = {},
  authToken?: string,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type':     'application/json',
    'X-App-Origin':     process.env.NEXT_PUBLIC_APP_NAME ?? 'javari-app',
    ...(PLATFORM_KEY  ? { 'X-Platform-Key': PLATFORM_KEY } : {}),
    ...(authToken     ? { 'Authorization': `Bearer ${authToken}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  }

  return fetch(`${PLATFORM_URL}/api${endpoint}`, {
    ...options,
    headers,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth module — delegates to craudiovizai.com OAuth
// ─────────────────────────────────────────────────────────────────────────────

export const auth = {
  // Get current user from session token
  async getUser(authToken: string): Promise<{
    id: string; email: string; name?: string; tier: string; credits: number
  } | null> {
    try {
      const res = await platformFetch('/auth/me', {}, authToken)
      if (!res.ok) return null
      return res.json()
    } catch { return null }
  },

  // Verify a user token
  async verify(token: string): Promise<boolean> {
    try {
      const res = await platformFetch('/auth/verify', {
        method: 'POST',
        body:   JSON.stringify({ token }),
      })
      return res.ok
    } catch { return false }
  },

  // Get OAuth login URL (redirects to craudiovizai.com OAuth)
  getLoginUrl(provider: 'google' | 'github' | 'apple' = 'google', returnTo?: string): string {
    const params = new URLSearchParams({
      provider,
      app: process.env.NEXT_PUBLIC_APP_NAME ?? 'javari-app',
      ...(returnTo ? { return_to: returnTo } : {}),
    })
    return `${PLATFORM_URL}/auth/oauth?${params.toString()}`
  },

  // Sign out
  async signOut(authToken: string): Promise<void> {
    await platformFetch('/auth/signout', { method: 'POST' }, authToken)
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Credits module — track and deduct credits
// ─────────────────────────────────────────────────────────────────────────────

export const credits = {
  // Get user's credit balance
  async getBalance(userId: string, authToken?: string): Promise<{
    balance: number; tier: string; never_expires: boolean
  }> {
    try {
      const res = await platformFetch(`/credits/balance?user_id=${userId}`, {}, authToken)
      if (!res.ok) return { balance: 0, tier: 'free', never_expires: false }
      return res.json()
    } catch { return { balance: 0, tier: 'free', never_expires: false } }
  },

  // Spend credits for an action
  async spend(
    userId:   string,
    amount:   number,
    action:   string,
    appId?:   string,
    authToken?: string,
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    try {
      const res = await platformFetch('/credits/spend', {
        method: 'POST',
        body:   JSON.stringify({ user_id: userId, amount, action, app_id: appId }),
      }, authToken)
      if (!res.ok) {
        const err = await res.json()
        return { success: false, newBalance: 0, error: err.error ?? 'Insufficient credits' }
      }
      return res.json()
    } catch (err) {
      return { success: false, newBalance: 0, error: String(err) }
    }
  },

  // Check if user has enough credits (without spending)
  async check(userId: string, amount: number, authToken?: string): Promise<boolean> {
    const { balance } = await credits.getBalance(userId, authToken)
    return balance >= amount
  },

  // Grant credits (for admins, social impact programs, etc.)
  async grant(
    userId:   string,
    amount:   number,
    reason:   string,
    authToken?: string,
  ): Promise<boolean> {
    try {
      const res = await platformFetch('/credits/grant', {
        method: 'POST',
        body:   JSON.stringify({ user_id: userId, amount, reason }),
      }, authToken)
      return res.ok
    } catch { return false }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Payments module — Stripe via craudiovizai.com
// ─────────────────────────────────────────────────────────────────────────────

export const payments = {
  // Create a Stripe checkout session
  async createCheckout(params: {
    userId:     string
    priceId:    string
    successUrl: string
    cancelUrl:  string
    authToken?: string
  }): Promise<{ url: string; sessionId: string } | null> {
    try {
      const res = await platformFetch('/payments/create-checkout', {
        method: 'POST',
        body:   JSON.stringify({
          user_id:     params.userId,
          price_id:    params.priceId,
          success_url: params.successUrl,
          cancel_url:  params.cancelUrl,
        }),
      }, params.authToken)
      if (!res.ok) return null
      return res.json()
    } catch { return null }
  },

  // Get subscription status
  async getSubscription(userId: string, authToken?: string): Promise<{
    status:     string
    tier:       string
    renewsAt?:  string
    cancelAt?:  string
  } | null> {
    try {
      const res = await platformFetch(`/payments/subscription?user_id=${userId}`, {}, authToken)
      if (!res.ok) return null
      return res.json()
    } catch { return null }
  },

  // Standard pricing — same across all apps
  PRICES: {
    starter_monthly:  process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER  ?? 'price_1SdaKx7YeQ1dZTUvCeaYqKXh',
    pro_monthly:      process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO      ?? 'price_1Sk8AZ7YeQ1dZTUvwpubHpWW',
    business_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS ?? 'price_1SdaLG7YeQ1dZTUvCzgdjaTp',
    credits_100:      process.env.NEXT_PUBLIC_STRIPE_CREDITS_100    ?? 'price_credits_100',
    credits_500:      process.env.NEXT_PUBLIC_STRIPE_CREDITS_500    ?? 'price_credits_500',
    credits_1000:     process.env.NEXT_PUBLIC_STRIPE_CREDITS_1000   ?? 'price_credits_1000',
  },

  // Credit packages pricing
  CREDIT_PACKAGES: [
    { credits: 100,  price: 5,   bonus: 0,    id: 'credits_100'  },
    { credits: 500,  price: 20,  bonus: 50,   id: 'credits_500'  },
    { credits: 1000, price: 35,  bonus: 150,  id: 'credits_1000' },
    { credits: 5000, price: 150, bonus: 1000, id: 'credits_5000' },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// AI module — call Javari AI from any app
// ─────────────────────────────────────────────────────────────────────────────

export const ai = {
  // Generate content using Javari AI (free models first)
  async generate(params: {
    prompt:     string
    system?:    string
    model?:     string  // defaults to free model
    maxTokens?: number
  }): Promise<string> {
    const GROQ_KEY = process.env.GROQ_API_KEY ?? ''
    const OR_KEY   = process.env.OPENROUTER_API_KEY ?? ''

    // Try OpenRouter free first
    if (OR_KEY) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${OR_KEY}`,
            'HTTP-Referer':  'https://craudiovizai.com',
          },
          body: JSON.stringify({
            model:      params.model ?? 'deepseek/deepseek-v4-flash:free',
            max_tokens: params.maxTokens ?? 2048,
            temperature: 0.7,
            messages: [
              ...(params.system ? [{ role: 'system', content: params.system }] : []),
              { role: 'user', content: params.prompt },
            ],
          }),
        })
        if (res.ok) {
          const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
          const text = d.choices?.[0]?.message?.content ?? ''
          if (text.length > 20) return text
        }
      } catch { /* fall through */ }
    }

    // Groq fallback
    if (GROQ_KEY) {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
        body:    JSON.stringify({
          model:      'llama-3.3-70b-versatile',
          max_tokens: params.maxTokens ?? 2048,
          temperature: 0.7,
          messages: [
            ...(params.system ? [{ role: 'system', content: params.system }] : []),
            { role: 'user', content: params.prompt },
          ],
        }),
      })
      if (res.ok) {
        const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
        return d.choices?.[0]?.message?.content ?? ''
      }
    }

    throw new Error('AI service unavailable — check GROQ_API_KEY or OPENROUTER_API_KEY')
  },

  // Execute a multi-agent team task
  async executeTeam(params: {
    objective:  string
    callerKey?: string
  }): Promise<string> {
    const key = params.callerKey ?? process.env.JAVARI_CALLER_KEY ?? ''
    const plan = {
      plan_id:              `sdk-${Date.now()}`,
      created_at:           new Date().toISOString(),
      total_estimated_cost: 0,
      tasks: [{
        id: 'task-1', role: 'builder', objective: params.objective,
        inputs: [], outputs: ['result'], dependencies: [],
        model: 'deepseek/deepseek-v4-flash:free',
        max_cost: 0, status: 'pending',
      }],
    }

    const javariUrl = process.env.JAVARI_AI_URL ?? 'https://javariai.com'
    const res = await fetch(`${javariUrl}/api/execute`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-javari-caller-key': key },
      body:    JSON.stringify(plan),
    })

    if (!res.ok || !res.body) throw new Error('Team execution failed')

    const reader  = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = '', result = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const parts = buf.split('\n\n')
      buf = parts.pop() ?? ''
      for (const part of parts) {
        if (!part.startsWith('data: ')) continue
        try {
          const evt = JSON.parse(part.slice(6))
          if (evt.type === 'task_complete') {
            const out = evt.result?.output ?? ''
            try { const p = JSON.parse(out); result = p.artifact ?? p.result ?? out }
            catch { result = out }
          }
        } catch { /* skip */ }
      }
    }

    return result
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics module — track events
// ─────────────────────────────────────────────────────────────────────────────

export const analytics = {
  async track(event: string, properties?: Record<string, unknown>): Promise<void> {
    try {
      await platformFetch('/analytics/track', {
        method: 'POST',
        body:   JSON.stringify({ event, properties, timestamp: new Date().toISOString() }),
      })
    } catch { /* non-fatal */ }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience: check if a user can perform an action (auth + credits check)
// ─────────────────────────────────────────────────────────────────────────────

export async function canPerformAction(
  authToken:    string,
  creditCost:   number,
  action:       string,
): Promise<{ allowed: boolean; user?: { id: string; email: string }; reason?: string }> {
  const user = await auth.getUser(authToken)
  if (!user) return { allowed: false, reason: 'Authentication required' }

  if (creditCost === 0) return { allowed: true, user }

  const hasCredits = await credits.check(user.id, creditCost, authToken)
  if (!hasCredits) return { allowed: false, user, reason: `Insufficient credits (need ${creditCost})` }

  return { allowed: true, user }
}

// ─────────────────────────────────────────────────────────────────────────────
// Default export — the Platform SDK
// ─────────────────────────────────────────────────────────────────────────────

export const PlatformSDK = {
  auth,
  credits,
  payments,
  ai,
  analytics,
  canPerformAction,
  PLATFORM_URL,
}

export default PlatformSDK
