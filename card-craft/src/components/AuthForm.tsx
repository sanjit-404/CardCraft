import { useEffect, useState, type FormEvent } from 'react'
import MiniCard from './MiniCard'
import { describeError, login, register } from '../api'
import { loginSchema, registerSchema } from '../cardSchema'
import { FINISHES } from '../finishes'
import type { Network, Session } from '../types'

type AuthFormProps = {
  notice: string // e.g. "Your session expired" after an automatic logout
  onLoggedIn: (session: Session) => void
}

// The demo card on the landing page cycles through these looks
const DEMO_LOOKS: { network: Network; finish: keyof typeof FINISHES; number: string }[] = [
  { network: 'visa', finish: 'ocean', number: '4111 1111 1111 1111' },
  { network: 'amex', finish: 'gold', number: '3782 822463 10005' },
  { network: 'mastercard', finish: 'holographic', number: '5555 5555 5555 4444' },
  { network: 'rupay', finish: 'carbon', number: '6521 8000 0000 0005' },
  { network: 'visa', finish: 'rose', number: '4012 8888 8888 1881' },
]

// A landing-style page: product name, a one-line pitch, an animated demo card,
// and one form for both logging in and registering.
function AuthForm({ notice, onLoggedIn }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [demoIndex, setDemoIndex] = useState(0)

  const isRegister = mode === 'register'
  const demo = DEMO_LOOKS[demoIndex]

  // Switch the demo card's look every few seconds
  useEffect(() => {
    const timer = setInterval(() => setDemoIndex((i) => (i + 1) % DEMO_LOOKS.length), 3200)
    return () => clearInterval(timer)
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault() // stop the browser reloading the page

    // Check the fields in the browser first, with the same rules as the server
    const schema = isRegister ? registerSchema : loginSchema
    const result = schema.safeParse({ email, password })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const { email: cleanEmail, password: cleanPassword } = result.data
      const session = isRegister ? await register(cleanEmail, cleanPassword) : await login(cleanEmail, cleanPassword)
      onLoggedIn(session)
    } catch (err) {
      // 409 = email already registered, 401 = wrong email or password.
      // Both come with a clear message from the server, which we show as is.
      setError(describeError(err))
      setSubmitting(false)
    }
  }

  function switchMode() {
    setMode(isRegister ? 'login' : 'register')
    setError('')
  }

  return (
    <main className="landing">
      <section className="landing-hero rise">
        <p className="brand-mark">
          <span className="brand-glyph" aria-hidden="true" />
          CardCraft
        </p>
        <h1 className="landing-title">
          Design cards that look <span className="accent-text">premium</span>.
        </h1>
        <p className="landing-pitch">
          A studio for crafting credit and debit card mockups: pick a finish, add co-brand badges, drag the name, then
          export at true card size.
        </p>
        <ul className="feature-list">
          <li>Live network detection</li>
          <li>PNG &amp; real-size PDF</li>
          <li>AI design review</li>
        </ul>

        <div className="demo-stage">
          {/* key restarts the fade-in animation each time the look changes */}
          <div key={demoIndex} className="demo-card">
            <MiniCard name="Alex Kumar" numberText={demo.number} network={demo.network} finish={FINISHES[demo.finish]} />
          </div>
        </div>
      </section>

      <form className="glass auth-form rise" style={{ animationDelay: '120ms' }} onSubmit={handleSubmit} noValidate>
        <div>
          <p className="eyebrow">{isRegister ? 'Get started' : 'Welcome back'}</p>
          <h2>{isRegister ? 'Create your account' : 'Log in to your studio'}</h2>
        </div>
        {notice && <p className="alert alert-notice">{notice}</p>}

        <label className="field">
          <span className="field-label">Email</span>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Password{isRegister && ' (at least 8 characters)'}</span>
          <input
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && (
          <p className="alert alert-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
        </button>

        <p className="hint switch-mode">
          {isRegister ? 'Already have an account?' : 'New to CardCraft?'}{' '}
          <button type="button" className="link-button" onClick={switchMode}>
            {isRegister ? 'Log in' : 'Create an account'}
          </button>
        </p>
      </form>
    </main>
  )
}

export default AuthForm
