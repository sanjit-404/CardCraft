import { useState, type FormEvent } from 'react'
import { describeError, login, register } from '../api'
import { loginSchema, registerSchema } from '../cardSchema'
import type { Session } from '../types'

type AuthFormProps = {
  notice: string // e.g. "Your session expired" after an automatic logout
  onLoggedIn: (session: Session) => void
}

// One form for both logging in and registering; a link switches between them.
function AuthForm({ notice, onLoggedIn }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isRegister = mode === 'register'

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
    <main className="auth">
      <h1>CardCraft</h1>
      <p className="hint">Design your own card mockup.</p>

      <form className="panel auth-form" onSubmit={handleSubmit} noValidate>
        <h2>{isRegister ? 'Create an account' : 'Log in'}</h2>
        {notice && <p className="notice-text">{notice}</p>}

        <label className="field">
          <span>Email</span>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label className="field">
          <span>Password{isRegister && ' (at least 8 characters)'}</span>
          <input
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? 'Please wait…' : isRegister ? 'Register' : 'Log in'}
        </button>

        <p className="hint">
          {isRegister ? 'Already have an account?' : 'New here?'}{' '}
          <button type="button" className="link-button" onClick={switchMode}>
            {isRegister ? 'Log in' : 'Create an account'}
          </button>
        </p>
      </form>
    </main>
  )
}

export default AuthForm
