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

    // Calculate cookie expiry based on token expiry (expires_in is in seconds)
    const accessTokenExpires = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000)

    const response = NextResponse.redirect(new URL('/', req.url)) // Redirect to your app's home or dashboard

    // Set HTTP-only secure cookies for tokens
    response.cookies.set('access_token', tokens.access_token, {
      httpOnly: true,
      path: '/',
      expires: accessTokenExpires,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    if (tokens.refresh_token) {
      // Refresh tokens usually have longer expiry
      const refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      response.cookies.set('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        path: '/',
        expires: refreshTokenExpires,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
    }

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Internal error', details: (error as Error).message }, { status: 500 })
  }
}
