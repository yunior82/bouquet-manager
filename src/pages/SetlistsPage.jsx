import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setlistsService } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { Plus, Calendar, MapPin, Trash2, Music, Search, ArrowUp, ArrowDown, Copy } from 'lucide-react'
import { format } from 'date-fns'

function CreateSetlistModal({ onClose, onSave }) {
  const [form, setForm] = useState({ event_name: '', date: '', location: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.event_name.trim() || !form.date) return
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Setlist just born</h3>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 0 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Call this thing</label>
            <input
              className="input"
              value={form.event_name}
              onChange={e => setForm({ ...form, event_name: e.target.value })}
              placeholder="Legendary name incoming"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Locate the madness</label>
            <input
              className="input"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder="Where we are ruining ears"
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <h3 className="modal-title" style={{ marginBottom: '1rem' }}>Confirm deletion</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

export default function SetlistsPage() {
  const navigate = useNavigate()
  const [setlists, setSetlists] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteSetlist, setDeleteSetlist] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const { success, error, confirm } = useToast()

  const fetchSetlists = async () => {
    try {
      const data = await setlistsService.getAll()
      const setlistsWithSongs = await Promise.all(
        data.map(async (s) => {
          const songs = await setlistsService.getSongs(s.id)
          return { ...s, songCount: songs.length }
        })
      )
      setSetlists(setlistsWithSongs)
    } catch (err) {
      error('Error loading setlists')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSetlists()
  }, [])

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  const getFilteredSetlists = () => {
    let filtered = setlists.filter(s => {
      const term = searchTerm.toLowerCase()
      return s.event_name.toLowerCase().includes(term)
    })
    
    filtered.sort((a, b) => {
      let valA = a[sortBy] || ''
      let valB = b[sortBy] || ''
      if (sortBy === 'date') {
        valA = new Date(valA).getTime()
        valB = new Date(valB).getTime()
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    
    return filtered
  }

  const filteredSetlists = getFilteredSetlists()
  const totalPages = Math.ceil(filteredSetlists.length / itemsPerPage)
  const paginatedSetlists = filteredSetlists.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSave = async (form) => {
    try {
      await setlistsService.create(form)
      success('Setlist created')
      fetchSetlists()
    } catch (err) {
      error('Error creating setlist')
    }
  }

  const handleDelete = async () => {
    try {
      await setlistsService.delete(deleteSetlist.id)
      success('Setlist deleted')
      fetchSetlists()
    } catch (err) {
      error('Error deleting')
    }
    setDeleteSetlist(null)
  }

  const handleDuplicate = async (setlist) => {
    const confirmed = await confirm(`Duplicate the vibe: "${setlist.event_name}"?`)
    if (!confirmed) return
    
    try {
      const newSetlist = {
        event_name: `${setlist.event_name} (Duplicated)`,
        date: format(new Date(), 'yyyy-MM-dd'),
        location: setlist.location || ''
      }
      const created = await setlistsService.create(newSetlist)
      
      const songs = await setlistsService.getSongs(setlist.id)
      for (const song of songs) {
        await setlistsService.addSong(created.id, song.songId, song.orderIndex)
      }
      
      success('Setlist duplicated')
      fetchSetlists()
      navigate(`/setlists/${created.id}`)
    } catch (err) {
      error('Error duplicating setlist')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ margin: 0 }}>Probably wrong setlists</h3>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> New
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={18} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search setlists..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            className="input"
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : filteredSetlists.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>{searchTerm ? 'No setlists match your search' : 'No setlists yet. Create the first one!'}</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('event_name')} style={{ cursor: 'pointer' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      Event {sortBy === 'event_name' && (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                    </span>
                  </th>
                  <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      Date {sortBy === 'date' && (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                    </span>
                  </th>
                  <th onClick={() => handleSort('songCount')} style={{ cursor: 'pointer' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      Songs {sortBy === 'songCount' && (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                    </span>
                  </th>
                  <th style={{ width: '80px' }}></th>
                </tr>
              </thead>
              <tbody>
                {paginatedSetlists.map(setlist => (
                  <tr key={setlist.id}>
                    <td>
                      <Link to={`/setlists/${setlist.id}`} style={{ color: 'var(--accent)' }}>
                        {setlist.event_name}
                      </Link>
                    </td>
                    <td>{format(new Date(setlist.date), 'dd/MM/yyyy')}</td>
                    <td>{setlist.songCount}</td>
                    <td>
                      <div className="table-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleDuplicate(setlist)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '0.25rem' }}
                          title="Duplicate"
                        >
                          <Copy size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteSetlist(setlist)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                {currentPage} / {totalPages}
              </span>
              <button className="btn btn-secondary" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          )}
        </>
      )}

      {modalOpen && <CreateSetlistModal onClose={() => setModalOpen(false)} onSave={handleSave} />}
      {deleteSetlist && (
        <ConfirmModal
          message={`Are you sure you want to delete setlist "${deleteSetlist.event_name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteSetlist(null)}
        />
      )}
    </div>
  )
}