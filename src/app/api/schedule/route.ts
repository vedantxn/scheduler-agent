import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { calendar, setCredentials } from '@/app/lib/google'

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: "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",
  defaultHeaders: {
    'HTTP-Referer': 'https://yourdomain.com', // replace with your site
    'X-Title': 'Safetos Schedule Assistant',
  },
})

export async function POST(req: Request) {
  try {
    const { input, tokens } = await req.json()

    if (!input) {
      return NextResponse.json({ error: 'Missing input' }, { status: 400 })
    }
    if (!tokens) {
      return NextResponse.json({ error: 'Missing Google OAuth tokens' }, { status: 400 })
    }

    // Inject today's date
    const today = new Date().toISOString().split('T')[0]

    // Build prompt for scheduling parsing
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

    // Call OpenRouter GPT model for parsing
    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1-0528-qwen3-8b:free",
      messages: [
        {
          role: 'system',
          content: 'You are a smart scheduling assistant. Parse natural language into title + datetime in ISO format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const message = completion.choices[0].message?.content || ''
    const parsed = JSON.parse(message.match(/\{[\s\S]*?\}/)?.[0] || '{}')

    // Add event to Google Calendar
    setCredentials(tokens)

    const eventBody = {
      summary: parsed.title,
      start: {
        dateTime: parsed.datetime,
      },
      end: {
        dateTime: new Date(new Date(parsed.datetime).getTime() + 60 * 60 * 1000).toISOString(), // +1 hour
      },
    }

    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventBody,
    })

    return NextResponse.json({
      success: true,
      event: res.data,
    })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
