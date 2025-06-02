import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Get cookies from request
    const accessToken = req.cookies.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Call Google Calendar API - list upcoming 5 events from primary calendar
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5&orderBy=startTime&singleEvents=true&timeMin=' + new Date().toISOString(),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!calendarResponse.ok) {
      const err = await calendarResponse.json()
      return NextResponse.json({ error: 'Failed to fetch calendar events', details: err }, { status: 500 })
    }

    const events = await calendarResponse.json()

    return NextResponse.json({ events })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error', details: (error as Error).message }, { status: 500 })
  }
}
