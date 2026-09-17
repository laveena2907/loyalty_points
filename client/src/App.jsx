
import { useState } from 'react'
import './App.css'

const API = 'http://localhost:5000'

function App() {
  const [page, setPage] = useState('landing')
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [authMode, setAuthMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [memberForm, setMemberForm] = useState({ name: '', phone: '' })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  async function authSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const endpoint =
        authMode === 'login'
          ? '/api/auth/login'
          : '/api/auth/register'

      const body =
        authMode === 'login'
          ? { email: form.email, password: form.password }
          : form

      const res = await fetch(API + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || 'Request failed')

      if (authMode === 'login') {
        localStorage.setItem('token', data.token)
        setToken(data.token)
        setPage('dashboard')
        setMessage('Login successful')
      } else {
        setAuthMode('login')
        setMessage('Registration successful. Please login.')
      }
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadMembers() {
    try {
      const res = await fetch(
        `${API}/api/members?search=${encodeURIComponent(search)}&page=1&limit=20&sort=name&order=asc`,
        { headers: authHeaders }
      )

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || 'Unable to load members')

      setMembers(data.members || data)
    } catch (err) {
      setMessage(err.message)
    }
  }

  async function createMember(e) {
    e.preventDefault()

    try {
      const res = await fetch(API + '/api/members', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(memberForm),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || 'Unable to create member')

      setMemberForm({ name: '', phone: '' })
      setMessage('Member created successfully')
      loadMembers()
    } catch (err) {
      setMessage(err.message)
    }
  }

  async function purchase(id) {
    const amount = prompt('Enter purchase amount (₹):')
    if (!amount) return

    try {
      const res = await fetch(`${API}/api/members/${id}/purchase`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ amount: Number(amount) }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || 'Purchase failed')

      setMessage(
        `Purchase recorded. Earned ${data.pointsEarned} points. Balance: ${data.pointsBalance}`
      )

      loadMembers()
    } catch (err) {
      setMessage(err.message)
    }
  }

  async function redeem(id) {
    const points = prompt('Enter points to redeem:')
    if (!points) return

    try {
      const res = await fetch(`${API}/api/members/${id}/redeem`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ points: Number(points) }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || 'Redemption failed')

      setMessage(`Redeemed ${points} points. New balance: ${data.pointsBalance}`)
      loadMembers()
    } catch (err) {
      setMessage(err.message)
    }
  }

  function logout() {
    localStorage.removeItem('token')
    setToken('')
    setPage('landing')
    setMembers([])
  }

  if (page === 'landing') {
    return (
      <main className="landing">
        <nav>
          <h2>CaféRewards</h2>
          <button onClick={() => { setAuthMode('login'); setPage('auth') }}>
            Login
          </button>
        </nav>

        <section className="hero-section">
          <div>
            <span className="badge">SMART CAFÉ LOYALTY</span>
            <h1>Reward your regulars.<br />Grow your café.</h1>
            <p>
              A simple loyalty management platform for café teams to
              manage members, purchases, rewards and loyalty tiers.
            </p>

            <button
              className="primary"
              onClick={() => {
                setAuthMode('register')
                setPage('auth')
              }}
            >
              Get Started
            </button>
          </div>

          <div className="hero-card">
            <div className="card-top">
              <span>Member Rewards</span>
              <strong>GOLD</strong>
            </div>
            <h2>1,280 pts</h2>
            <p>Available rewards balance</p>
            <div className="progress">
              <span></span>
            </div>
            <small>220 points until Platinum</small>
          </div>
        </section>

        <section className="features">
          <div>
            <h3>Member Management</h3>
            <p>Search and manage your café loyalty members quickly.</p>
          </div>
          <div>
            <h3>Smart Rewards</h3>
            <p>Automatically calculate points from every purchase.</p>
          </div>
          <div>
            <h3>Tier Progression</h3>
            <p>Silver, Gold and Platinum rewards for loyal customers.</p>
          </div>
        </section>

        <section className="future">
          <h2>What's next?</h2>
          <p>
            Future versions can add QR-code check-ins, mobile notifications,
            analytics dashboards and personalized offers.
          </p>
        </section>
      </main>
    )
  }

  if (page === 'auth') {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1>CaféRewards</h1>
          <h2>{authMode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p>
            {authMode === 'login'
              ? 'Login to manage your loyalty members.'
              : 'Register your café account.'}
          </p>

          <form onSubmit={authSubmit}>
            {authMode === 'register' && (
              <>
                <input
                  placeholder="Name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
                <input
                  placeholder="Phone"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </>
            )}

            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />

            <button className="primary" disabled={loading}>
              {loading
                ? 'Please wait...'
                : authMode === 'login'
                  ? 'Login'
                  : 'Register'}
            </button>
          </form>

          {message && <div className="message">{message}</div>}

          <button
            className="link-button"
            onClick={() =>
              setAuthMode(authMode === 'login' ? 'register' : 'login')
            }
          >
            {authMode === 'login'
              ? 'Create a new account'
              : 'Already have an account? Login'}
          </button>

          <button className="back" onClick={() => setPage('landing')}>
            ← Back
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="dashboard">
      <nav>
        <div>
          <h2>CaféRewards</h2>
          <span>LOYALTY MANAGEMENT</span>
        </div>
        <button onClick={logout}>Logout</button>
      </nav>

      <section className="dashboard-header">
        <div>
          <span className="badge">DASHBOARD</span>
          <h1>Members</h1>
          <p>Manage customers, purchases and loyalty rewards.</p>
        </div>
      </section>

      <section className="controls">
        <input
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loadMembers()}
        />
        <button onClick={loadMembers}>Search</button>
      </section>

      <form className="member-form" onSubmit={createMember}>
        <input
          placeholder="New member name"
          value={memberForm.name}
          onChange={e =>
            setMemberForm({ ...memberForm, name: e.target.value })
          }
          required
        />
        <input
          placeholder="Phone number"
          value={memberForm.phone}
          onChange={e =>
            setMemberForm({ ...memberForm, phone: e.target.value })
          }
          required
        />
        <button className="primary">Add Member</button>
      </form>

      {message && <div className="message">{message}</div>}

      <section className="member-list">
        {members.length === 0 ? (
          <div className="empty">
            <h3>No members loaded</h3>
            <p>Search or add a member to get started.</p>
            <button onClick={loadMembers}>Load Members</button>
          </div>
        ) : (
          members.map(member => (
            <article className="member-card" key={member._id}>
              <div>
                <h3>{member.name}</h3>
                <p>{member.phone}</p>
              </div>

              <div className="member-stat">
                <strong>{member.pointsBalance || 0}</strong>
                <span>points</span>
              </div>

              <div className={`tier ${member.tier?.toLowerCase()}`}>
                {member.tier || 'SILVER'}
              </div>

              <div className="actions">
                <button onClick={() => purchase(member._id)}>
                  Purchase
                </button>
                <button onClick={() => redeem(member._id)}>
                  Redeem
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  )
}

export default App