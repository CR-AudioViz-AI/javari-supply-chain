// app/api/generate/route.ts — javari-supply-chain
// AI generation powered by Javari AI (free models)
import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const GROQ_API_KEY     = process.env.GROQ_API_KEY     ?? ''
const OPENROUTER_KEY   = process.env.OPENROUTER_API_KEY ?? ''
const CREDIT_COST      = 8
const SYSTEM           = `You are a supply chain optimization expert. Help businesses optimize their supply chain, find suppliers, manage inventory, and reduce costs.`
const ACTIONS          = ["supplier_analysis", "inventory_optimization", "logistics_plan", "cost_reduction", "supplier_contract", "risk_assessment"]

async function generate(prompt: string): Promise<string> {
  if (OPENROUTER_KEY) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_KEY}`, 'HTTP-Referer': 'https://craudiovizai.com' },
        body: JSON.stringify({ model: 'deepseek/deepseek-v4-flash:free', max_tokens: 2048, temperature: 0.7,
          messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }] }),
      })
      if (res.ok) {
        const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
        const t = d.choices?.[0]?.message?.content ?? ''
        if (t.length > 50) return t
      }
    } catch { /* fall through */ }
  }
  if (GROQ_API_KEY) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', max_tokens: 2048, temperature: 0.7,
        messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }] }),
    })
    if (res.ok) {
      const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
      return d.choices?.[0]?.message?.content ?? ''
    }
  }
  throw new Error('AI service unavailable')
}

export async function GET() {
  return NextResponse.json({ actions: ACTIONS, cost: CREDIT_COST + ' credits', model: 'Javari AI (free)', cost_usd: '$0.00' })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { action: string; input: string; context?: Record<string, string> }
    if (!body.input?.trim()) return NextResponse.json({ error: 'input required' }, { status: 400 })
    if (!ACTIONS.includes(body.action)) return NextResponse.json({ error: 'invalid action', available: ACTIONS }, { status: 400 })
    const prompt = `${body.action.replace(/_/g,' ')}: ${body.input}${body.context ? '\n\nContext: ' + JSON.stringify(body.context) : ''}`
    const result = await generate(prompt)
    return NextResponse.json({ result, action: body.action, cost_usd: '$0.00', credits_used: CREDIT_COST })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
