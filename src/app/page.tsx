'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function SchedulePage() {
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [tokens, setTokens] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()

  // Step 1: On mount, check if URL has ?code= from Google OAuth
  useEffect(() => {
    const code = searchParams.get('code')
    if (code && !tokens) {
      // Exchange code for tokens
      fetch(`/api/auth/callback?code=${code}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError('OAuth failed: ' + data.error)
          } else {
            setTokens(data)
            localStorage.setItem('googleTokens', JSON.stringify(data))
            // Clean URL to remove code param
            router.replace(window.location.pathname)
          }
        })
        .catch(() => setError('OAuth exchange failed'))
    } else {
      // Try load tokens from localStorage on page load
      const stored = localStorage.getItem('googleTokens')
      if (stored) setTokens(JSON.parse(stored))
    }
  }, [searchParams, tokens, router])

  // Step 2: On login button click, start OAuth flow
  async function loginWithGoogle() {
    const res = await fetch('/api/auth/url')
    if (!res.ok) {
      console.error('Failed to get auth URL')
      return
    }
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    }
  }
  
  // Step 3: Send scheduling request with tokens + input
  const sendSchedule = async () => {
    setError('')
    setResponse('')
    if (!input) {
      setError('Please enter event text')
      return
    }
    if (!tokens) {
      setError('Please login with Google first')
      return
    }
    setLoading(true)

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, tokens }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else if (data.success) {
        setResponse(
          `Event created!\nTitle: ${data.event.summary}\nStart: ${data.event.start.dateTime}`
        )
      } else {
        setError('Unknown error')
      }
    } catch (e) {
      setError('Request failed')
    } finally {
      setLoading(false)
    }
  }

  // Step 4: Simple logout clears tokens
  const logout = () => {
    setTokens(null)
    localStorage.removeItem('googleTokens')
    setResponse('')
    setError('')
  }

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Scheduling Assistant</h1>

      {!tokens ? (
        <button
          onClick={loginWithGoogle}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Login with Google
        </button>
      ) : (
        <>
          <button
            onClick={logout}
            className="mb-4 text-sm underline text-red-600"
          >
            Logout
          </button>

          <textarea
            placeholder="Type event description, e.g. 'Call Jack next Thursday at 3pm'"
            className="w-full p-2 border rounded mb-2"
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <button
            onClick={sendSchedule}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>

          {error && (
            <p className="mt-4 text-red-600 whitespace-pre-wrap">{error}</p>
          )}
          {response && (
            <pre className="mt-4 bg-gray-100 p-3 rounded whitespace-pre-wrap">
              {response}
            </pre>
          )}
        </>
      )}
    </main>
  )
}
