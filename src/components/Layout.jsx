import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import logo_bouquet from '../assets/logo_bouquet.png'

export default function Layout({ onLogout, user }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ 
        background: 'var(--bg-secondary)', 
        borderBottom: '1px solid var(--border)',
        padding: '1rem 1.5rem'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}>
          <img src={logo_bouquet} alt="Bouquet" style={{ height: '40px' }} />
          {isMobile ? (
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.25rem' }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          ) : (
            <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <NavLink 
                to="/" 
                className={({ isActive }) => isActive ? 'btn btn-primary' : 'btn btn-ghost'}
                end
              >
                Home
              </NavLink>
              <NavLink 
                to="/songs" 
                className={({ isActive }) => isActive ? 'btn btn-primary' : 'btn btn-ghost'}
              >
                Songs
              </NavLink>
              <NavLink 
                to="/setlists" 
                className={({ isActive }) => isActive ? 'btn btn-primary' : 'btn btn-ghost'}
              >
                Setlists
              </NavLink>
              <NavLink 
                to="/stats" 
                className={({ isActive }) => isActive ? 'btn btn-primary' : 'btn btn-ghost'}
              >
                Stats
              </NavLink>
              <button 
                onClick={onLogout}
                className="btn btn-ghost"
                style={{ marginLeft: '0.5rem' }}
              >
                Salir
              </button>
            </nav>
          )}
        </div>
      </header>
      {isMobile && mobileMenuOpen && (
        <nav style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '0.5rem',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)'
        }}>
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? 'btn btn-primary' : 'btn btn-ghost'}
            end
          >
            Home
          </NavLink>
          <NavLink 
            to="/songs" 
            className={({ isActive }) => isActive ? 'btn btn-primary' : 'btn btn-ghost'}
          >
            Songs
          </NavLink>
          <NavLink 
            to="/setlists" 
            className={({ isActive }) => isActive ? 'btn btn-primary' : 'btn btn-ghost'}
          >
            Setlists
          </NavLink>
          <NavLink 
            to="/stats" 
            className={({ isActive }) => isActive ? 'btn btn-primary' : 'btn btn-ghost'}
          >
            Stats
          </NavLink>
          <button 
            onClick={onLogout}
            className="btn btn-ghost"
          >
            Salir
          </button>
        </nav>
      )}
      <main style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  )
}