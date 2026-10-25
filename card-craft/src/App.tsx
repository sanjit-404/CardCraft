import './App.css'
import { useEffect, useState } from 'react'
import AuthForm from './components/AuthForm'
import Header from './components/Header'
import Toaster from './components/Toaster'
import Workspace from './components/Workspace'
import { setUnauthorizedHandler } from './api'
import { clearSession, getSession, saveSession } from './session'
import type { Session } from './types'

// The top of the app: shows the login screen, or the workspace once logged in.
function App() {
  // Start with whatever session was saved in the browser (if any)
  const [session, setSession] = useState<Session | null>(() => getSession())
  // A message for the login screen, e.g. after an automatic logout
  const [notice, setNotice] = useState('')

  // If any /api/cards request says our token is bad (401), log out.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()
      setSession(null)
      setNotice('Your session has expired. Please log in again.')
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  function handleLoggedIn(newSession: Session) {
    saveSession(newSession)
    setSession(newSession)
    setNotice('')
  }

  function handleLogout() {
    clearSession()
    setSession(null)
    setNotice('')
  }

  return (
    <>
      {/* Slowly drifting glowing orbs behind everything (decoration only) */}
      <div className="backdrop" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      {session ? (
        <div className="app">
          <Header email={session.user.email} onLogout={handleLogout} />
          {/* The key makes a different user get a completely fresh workspace */}
          <Workspace key={session.user.id} />
        </div>
      ) : (
        <AuthForm notice={notice} onLoggedIn={handleLoggedIn} />
      )}

      {/* Pop-up messages (saved, deleted, errors) */}
      <Toaster />
    </>
  )
}

export default App
