import './WelcomePage.css'
import { useNavigate } from 'react-router-dom'

export default function HappyTailsScreen() {
  const navigate = useNavigate()

  return (
    <main className="welcome-screen">
      <section className="welcome-brand-area">
        <h1 className="welcome-brand-text">Happy Tails</h1>
      </section>

      <section className="welcome-actions-panel">
        <button
          className="welcome-action-button"
          onClick={() => navigate('/login')}
        >
          I HAVE A HAPPY TAIL ACCOUNT
        </button>

        <div className="welcome-divider">
          <span className="welcome-divider-line" />
          <span className="welcome-divider-text">New to Happy Tails?</span>
          <span className="welcome-divider-line" />
        </div>

        <button
          className="welcome-action-button"
          onClick={() => alert('Navigate to Register')}
        >
          CREATE YOUR HAPPY TAIL ACCOUNT
        </button>
      </section>
    </main>
  )
}