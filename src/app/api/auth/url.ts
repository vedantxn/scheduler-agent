// app/api/auth/url/route.ts (Next.js API Route)
import { NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI

export async function GET() {
  if (!GOOGLE_CLIENT_ID || !REDIRECT_URI) {
    return NextResponse.json({ error: 'Missing env variables' }, { status: 500 })
  }

  const scope = [
    'https://www.googleapis.com/auth/calendar.events',
    'openid',
    'email',
    'profile',
  ].join(' ')

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`

  return NextResponse.json({ url: authUrl })
}
