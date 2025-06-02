'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun, LogIn, LogOut, Send, CalendarCheck, Sparkles, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SchedulePage() {
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [tokens, setTokens] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [darkMode, setDarkMode] = useState(true)

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
    <main className="min-h-screen bg-white dark:bg-zinc-900 transition-colors duration-300 text-zinc-800 dark:text-white">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 shadow-sm dark:shadow-md">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-green-500" />
          Schedule Assistant
        </h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="rounded-full p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-blue-600" />
          )}
        </motion.button>
      </header>

      {/* Hero */}
      <section className="px-6 py-12 text-center max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight"
        >
          Automate Your Schedule with <span className="text-green-500">AI</span>
        </motion.h2>
        <p className="text-zinc-600 dark:text-zinc-300 text-lg mb-8">
          Your personal assistant for creating smart calendar events with just one prompt.
        </p>
        {!tokens && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={loginWithGoogle}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md transition"
          >
            <LogIn className="w-5 h-5" />
            Login with Google
          </motion.button>
        )}
      </section>

      {/* Features */}
      <section className="px-6 py-8 bg-zinc-100 dark:bg-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center max-w-6xl mx-auto rounded-xl">
        {[
          ['🧠 Smart Parsing', 'Understands natural language prompts.'],
          ['📆 Seamless Sync', 'Adds events directly to Google Calendar.'],
          ['🌗 Light/Dark Mode', 'Slick modern design that adapts.'],
        ].map(([emoji, text], i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-xl bg-white dark:bg-zinc-900 shadow-sm dark:shadow-md"
          >
            <div className="text-3xl mb-2">{emoji}</div>
            <p className="font-medium">{text}</p>
          </motion.div>
        ))}
      </section>

      {/* Assistant Panel */}
      {tokens && (
        <section className="px-6 py-12 max-w-2xl mx-auto w-full">
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Ask your assistant
          </h3>

          <textarea
            placeholder="e.g., Schedule AI brainstorming at 5pm Thursday."
            className="w-full p-4 rounded-xl border dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition"
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={sendSchedule}
            className={`mt-4 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white transition w-full shadow-lg ${
              loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
            }`}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
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

          <div className="text-right mt-4">
            <button
              onClick={logout}
              className="text-sm text-red-500 underline flex items-center gap-1 hover:text-red-600 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-zinc-500 dark:text-zinc-400">
        Made with 💙 by <span className="font-semibold text-black dark:text-white">Vedant & AI</span>
      </footer>
    </main>
  )
}
