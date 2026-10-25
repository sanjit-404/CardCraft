type HeaderProps = {
  email: string
  onLogout: () => void
}

// The top bar: app name, who is logged in, and a logout button.
function Header({ email, onLogout }: HeaderProps) {
  return (
    <header className="header glass">
      <p className="brand-mark">
        <span className="brand-glyph" aria-hidden="true" />
        CardCraft
      </p>
      <div className="header-user">
        <span className="avatar" aria-hidden="true">
          {email.charAt(0).toUpperCase()}
        </span>
        <span className="header-email">{email}</span>
        <button type="button" className="btn btn-small btn-ghost" onClick={onLogout}>
          Log out
        </button>
      </div>
    </header>
  )
}

export default Header
