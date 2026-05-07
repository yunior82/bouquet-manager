import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle()

      if (fetchError) {
        console.error('Supabase error:', fetchError)
        setError('Error de conexión')
        setLoading(false)
        return
      }

      if (!data) {
        setError('Usuario o contraseña incorrectos')
        setLoading(false)
        return
      }

      localStorage.setItem('bouquet_user', JSON.stringify(data))
      onLogin(data)
    } catch (err) {
      console.error('Login error:', err)
      setError('Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'var(--bg-primary)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Welcome Buquis</h1>
        <p style={{ 
          textAlign: 'center', 
          color: 'var(--text-secondary)', 
          marginBottom: '2rem',
          fontSize: '0.875rem'
        }}>
          Authorized noise makers
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Rockstar ID</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Secret riff code</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ 
              color: 'var(--danger)', 
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Loading bad decisions…' : 'Let me in'}
          </button>
        </form>
      </div>
    </div>
  )
}