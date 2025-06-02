'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Moon, Sun, LogIn, LogOut, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SchedulePage() {
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [tokens, setTokens] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [darkMode, setDarkMode] = useState(true)
  const searchParams = useSearchParams()

  useEffect(() => {
    const theme = localStorage.getItem('theme')
    if (theme === 'light') setDarkMode(false)
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    async function checkSession() {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      if (data.loggedIn) setTokens(true)
    }
    checkSession()
  }, [])

  const loginWithGoogle = async () => {
    const res = await fetch('/api/auth/url')
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  const sendSchedule = async () => {
    if (!input) return setError('⚠️ Please enter event text')
    if (!tokens) return setError('⚠️ Please login with Google first')

    setLoading(true)
    setError('')
    setResponse('')

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else if (data.success) {
        setResponse(`✅ Event created!\n\n📅 ${data.event.summary}\n🕒 ${data.event.start.dateTime}`)
      } else setError('❌ Unknown error')
    } catch {
      setError('❌ Request failed')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setTokens(null)
    localStorage.removeItem('googleTokens')
    setResponse('')
    setError('')
  }

  const toggleTheme = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('theme', newMode ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', newMode)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-6 bg-white dark:bg-zinc-900 transition-colors duration-300">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            🧠 Schedule Assistant
          </h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="rounded-full p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-blue-600" />}
          </motion.button>
        </div>

        {!tokens ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={loginWithGoogle}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md transition w-full justify-center"
          >
            <LogIn className="w-5 h-5" />
            Login with Google
          </motion.button>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={logout}
                className="text-sm text-red-500 underline flex items-center gap-1 hover:text-red-600 transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>

            <textarea
              placeholder="Type something like: 'Schedule a call to Mr.Beast on 9pm next suday.'"
              className="w-full p-4 rounded-xl border dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition"
              rows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={sendSchedule}
              className={`mt-4 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white transition w-full shadow-lg ${
                loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
              }`}
              disabled={loading}
            >
              <Send className="w-5 h-5" />
              {loading ? 'Sending...' : 'Send to Calendar'}
            </motion.button>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-4 text-red-500 whitespace-pre-wrap text-sm"
                >
                  {error}
                </motion.p>
              )}
              {response && (
                <motion.pre
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-4 bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-100"
                >
                  {response}
                </motion.pre>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <footer className="mt-10 text-xs text-zinc-500 dark:text-zinc-400">
        Made by <span className="font-semibold text-black dark:text-white">Vedant & AI</span> 💙
      </footer>
    </main>
  )
}
