import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get('access_token')?.value
  if (!accessToken) {
    return NextResponse.json({ loggedIn: false })
  }

  // Optional: verify token or fetch user info if needed

  return NextResponse.json({ loggedIn: true })
}
