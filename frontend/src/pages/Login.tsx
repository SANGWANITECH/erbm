import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import client from '../api/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('username', email)
      params.append('password', password)
      const res = await client.post('/auth/login', params)
      setAuth(res.data.access_token, res.data.name, res.data.role)
      navigate('/')
    } catch {
      setError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', fontSize: '13px',
    border: '1px solid var(--border-dark)', borderRadius: '6px',
    background: '#fff', color: 'var(--text-primary)', outline: 'none',
    fontFamily: 'Inter, sans-serif',
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Top navy bar */}
      <div style={{
        background: 'var(--navy)', height: '52px',
        borderBottom: '3px solid var(--gold)',
        display: 'flex', alignItems: 'center', padding: '0 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '30px', height: '30px', background: 'var(--gold)',
            borderRadius: '4px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 700, fontSize: '11px', color: 'var(--navy)',
          }}>RBM</div>
          <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>Reserve Bank of Malawi</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Card */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '8px', overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
          }}>
            {/* Card header */}
            <div style={{
              background: 'var(--bg-2)', borderBottom: '1px solid var(--border)',
              padding: '20px 24px',
            }}>
              <h1 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Exchange Rate Intelligence System
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                Authorised personnel only. Sign in with your RBM analyst credentials.
              </p>
            </div>

            {/* Form */}
            <div style={{ padding: '24px' }}>
              {error && (
                <div style={{
                  background: 'var(--red-dim)', border: '1px solid var(--red)',
                  borderRadius: '6px', padding: '10px 14px', marginBottom: '16px',
                  fontSize: '12px', color: 'var(--red)',
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Email address
                  </label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="analyst@rbm.mw" style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--teal-dim)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-dark)'; e.currentTarget.style.boxShadow = 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Password
                  </label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password" style={inputStyle}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--teal-dim)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-dark)'; e.currentTarget.style.boxShadow = 'none' }} />
                </div>
                <button onClick={handleLogin} disabled={loading}
                  style={{
                    background: loading ? '#94A3B8' : 'var(--navy)', color: '#fff',
                    border: 'none', borderRadius: '6px', padding: '11px',
                    fontSize: '13px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                    width: '100%', marginTop: '4px', letterSpacing: '0.02em',
                  }}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </div>

            {/* Card footer */}
            <div style={{
              background: 'var(--bg-2)', borderTop: '1px solid var(--border)',
              padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Secure connection · This system is for authorised RBM personnel only
              </span>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
            Exchange Rate Intelligence System · Reserve Bank of Malawi · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
