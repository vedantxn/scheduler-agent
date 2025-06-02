import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // parse code from URL
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  // TODO: Exchange code for tokens here

  return NextResponse.json({ message: 'Code received', code });
}
