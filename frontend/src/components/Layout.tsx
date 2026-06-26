import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { BarChart2, Bell, TrendingUp, LayoutDashboard, LogOut, User, Menu, X } from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Overview' },
  { path: '/rates', icon: BarChart2, label: 'Live Rates' },
  { path: '/charts', icon: TrendingUp, label: 'Trend Analysis' },
  { path: '/alerts', icon: Bell, label: 'Alerts' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { name, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const NavContent = () => (
    <>
      <div style={{ padding: '0 12px', marginBottom: '8px' }}>
        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Navigation
        </span>
      </div>
      {navItems.map(({ path, icon: Icon, label }) => {
        const active = location.pathname === path
        return (
          <button key={path} onClick={() => { navigate(path); setSidebarOpen(false) }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 16px', border: 'none', cursor: 'pointer',
              background: active ? 'var(--teal-dim)' : 'transparent',
              color: active ? 'var(--teal)' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: active ? 600 : 400,
              borderLeft: active ? '3px solid var(--teal)' : '3px solid transparent',
              width: '100%', textAlign: 'left',
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
          >
            <Icon size={16} />
            {label}
          </button>
        )
      })}
      <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--border)' }}>
        <button onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
            padding: '8px 12px', border: '1px solid var(--border-dark)', borderRadius: '6px',
            background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-dark)' }}
        >
          <LogOut size={13} /> Sign out
        </button>
        <div style={{ marginTop: '12px', fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, marginBottom: '2px' }}>ERBM v1.0.0</div>
          <div>Data: ExchangeRate-API</div>
          <div>Updates: Every hour</div>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .main-content { margin-left: 0 !important; }
          .header-name { display: none !important; }
          .header-signout { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
          .mobile-overlay { display: none !important; }
          .mobile-drawer { display: none !important; }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Top header */}
        <div style={{
          background: 'var(--navy)', height: '52px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', flexShrink: 0,
          borderBottom: '3px solid var(--gold)', zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Mobile menu button */}
            <button className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'transparent', border: 'none', color: '#fff',
                cursor: 'pointer', padding: '4px', alignItems: 'center', display: 'none',
              }}>
              <Menu size={20} />
            </button>
            <div style={{
              width: '30px', height: '30px', background: 'var(--gold)',
              borderRadius: '4px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 700, fontSize: '11px', color: 'var(--navy)',
              flexShrink: 0,
            }}>RBM</div>
            <div>
              <div style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>Reserve Bank of Malawi</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '10px', letterSpacing: '0.05em' }}>Exchange Rate Intelligence System</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80' }} />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>Operational</span>
            </div>
            <div className="header-name" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
              <User size={13} />
              <span>{name}</span>
            </div>
            <button className="header-signout" onClick={handleLogout}
              style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.8)', borderRadius: '6px', padding: '5px 12px',
                fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
              }}>
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

          {/* Desktop sidebar */}
          <div className="desktop-sidebar" style={{
            width: '200px', background: 'var(--surface)', borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', padding: '16px 0', flexShrink: 0,
          }}>
            <NavContent />
          </div>

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div className="mobile-overlay"
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                zIndex: 200,
              }} />
          )}

          {/* Mobile drawer */}
          {sidebarOpen && (
            <div className="mobile-drawer" style={{
              position: 'fixed', top: 0, left: 0, bottom: 0, width: '240px',
              background: 'var(--surface)', zIndex: 300, display: 'flex',
              flexDirection: 'column', padding: '16px 0',
              boxShadow: '4px 0 16px rgba(0,0,0,0.15)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 16px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Menu</span>
                <button onClick={() => setSidebarOpen(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '2px' }}>
                  <X size={18} />
                </button>
              </div>
              <NavContent />
            </div>
          )}

          {/* Main content */}
          <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
