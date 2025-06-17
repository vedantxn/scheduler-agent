import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { calendar, setCredentials } from '@/app/lib/google'

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    'HTTP-Referer': 'https://scheduler-agent-self.vercel.app',
    'X-Title': 'Safetos Schedule Assistant',
  },
})

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json()
    if (!input) {
      return NextResponse.json({ error: 'Missing input' }, { status: 400 })
    }

    const access_token = req.cookies.get('access_token')?.value
    const refresh_token = req.cookies.get('refresh_token')?.value

    if (!access_token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Set Google API credentials
    setCredentials({ access_token, refresh_token })

    const today = new Date().toISOString().split('T')[0]
    const prompt = `
Today is ${today}.
Parse the following text into a structured event with title and ISO datetime.

Text: "${input}"

Return ONLY a JSON like:
{
  "title": "...",
  "datetime": "yyyy-mm-ddTHH:MM:SS"
}
`

    const completion = await openai.chat.completions.create({
      model: 'deepseek/deepseek-r1-0528:free',
      messages: [
        {
          role: 'system',
          content: 'You are a smart scheduling assistant. Parse natural language into title + datetime in ISO format.',
        },
        { role: 'user', content: prompt },
      ],
    })

    const message = completion.choices[0].message?.content || ''
    console.log('AI raw message:', message)

    const jsonString = message.match(/\{[\s\S]*?\}/)?.[0]
    if (!jsonString) {
      throw new Error('No JSON found in AI response')
    }

    const parsed = JSON.parse(jsonString)
    console.log('Parsed event:', parsed)

    if (!parsed.title || !parsed.datetime) {
      throw new Error('Parsed event missing title or datetime')
    }

    const eventBody = {
      summary: parsed.title,
      start: { dateTime: parsed.datetime },
      end: { dateTime: new Date(new Date(parsed.datetime).getTime() + 60 * 60 * 1000).toISOString() }, // 1 hour later
    }

    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventBody,
    })

    return NextResponse.json({ success: true, event: res.data })
  } catch (err) {
    console.error('API error:', (err as Error).message, err)
    return NextResponse.json({ error: 'Something went wrong', details: (err as Error).message }, { status: 500 })
  }
}
