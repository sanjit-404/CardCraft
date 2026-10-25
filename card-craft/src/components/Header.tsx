type HeaderProps = {
  email: string
  onLogout: () => void
}

// The top bar: app name, who is logged in, and a logout button.
function Header({ email, onLogout }: HeaderProps) {
  return (
    <header className="header">
      <h1>CardCraft</h1>
      <div className="header-user">
        <span className="header-email">{email}</span>
        <button type="button" onClick={onLogout}>
          Log out
        </button>
      </div>
    </header>
  )
}

export default Header
