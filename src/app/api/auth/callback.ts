import { NextResponse } from 'next/server'
import { getTokens } from '@/app/lib/google'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  const tokens = await getTokens(code)

  // TODO: Store tokens in DB/session/cookie for user

  // For testing, just return tokens
  return NextResponse.json(tokens)
}
