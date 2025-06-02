import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text()
      return NextResponse.json({ error: 'Failed to fetch token', details: errorBody }, { status: 500 })
    }

    const tokens = await tokenResponse.json()

    // Store tokens in HTTP-only cookies (for security)
    const response = NextResponse.redirect(new URL('/', req.url)) // redirect to home or dashboard

    response.cookies.set('access_token', tokens.access_token, { httpOnly: true, path: '/' })
    if (tokens.refresh_token) {
      response.cookies.set('refresh_token', tokens.refresh_token, { httpOnly: true, path: '/' })
    }
    // optionally set expiry, secure flag if HTTPS in production

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Internal error', details: (error as Error).message }, { status: 500 })
  }
}
