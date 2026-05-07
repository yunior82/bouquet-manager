import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Music, Calendar, BarChart3, Guitar } from 'lucide-react'
import { setlistsService } from '../lib/supabase'

export default function HomePage() {
  const [recentSetlists, setRecentSetlists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const data = await setlistsService.getAll()
      setRecentSetlists(data.slice(0, 5))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
<div style={{ 
        textAlign: 'center', 
        marginBottom: '3rem',
        padding: '3rem 1rem',
        background: 'linear-gradient(180deg, rgba(220,38,38,0.1) 0%, transparent 100%)',
        borderBottom: '2px solid var(--accent)'
      }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>BOUQUET</h1>
        <p style={{ color: '#666', letterSpacing: '4px', fontSize: '0.75rem' }}>The Quality of Madness</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        <Link to="/songs" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', transition: 'all 0.3s', cursor: 'pointer' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'var(--bg-tertiary)',
              border: '2px solid var(--border)'
            }}>
              <Music size={28} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 400, fontSize: '1.1rem', letterSpacing: '3px' }}>Beer-ready tracks</div>
              <div style={{ color: '#666', fontSize: '0.7rem', letterSpacing: '2px' }}>All songs we think we can play</div>
            </div>
          </div>
        </Link>
        
        <Link to="/setlists" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', transition: 'all 0.3s', cursor: 'pointer' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'var(--bg-tertiary)',
              border: '2px solid var(--border)'
            }}>
              <Calendar size={28} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 400, fontSize: '1.1rem', letterSpacing: '3px' }}>Drunk-approved setlists</div>
              <div style={{ color: '#666', fontSize: '0.7rem', letterSpacing: '2px' }}>The ‘this will be fine’ shows</div>
            </div>
          </div>
        </Link>
        
        <Link to="/stats" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', transition: 'all 0.3s', cursor: 'pointer' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'var(--bg-tertiary)',
              border: '2px solid var(--border)'
            }}>
              <BarChart3 size={28} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 400, fontSize: '1.1rem', letterSpacing: '3px' }}>Stats & questionable data</div>
              <div style={{ color: '#666', fontSize: '0.7rem', letterSpacing: '2px' }}>Performance damage report</div>
            </div>
          </div>
        </Link>
      </div>

      <h3 style={{ marginBottom: '1rem', borderLeft: '4px solid var(--accent)', paddingLeft: '1rem' }}>Latest musical crimes</h3>
      
      {loading ? (
        <p style={{ color: '#666' }}>Loading...</p>
      ) : recentSetlists.length === 0 ? (
        <p style={{ color: '#666' }}>No setlists yet.</p>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentSetlists.map(setlist => (
                <tr key={setlist.id}>
                  <td>
                    <Link to={`/setlists/${setlist.id}`} style={{ color: 'var(--accent)' }}>
                      {setlist.event_name}
                    </Link>
                  </td>
                  <td style={{ color: '#666' }}>{setlist.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}