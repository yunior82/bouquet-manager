import { useState, useEffect } from 'react'
import { songsService } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { Plus, Search, Edit, Trash2, X, ArrowUp, ArrowDown } from 'lucide-react'

function SongModal({ song, types, onClose, onSave, existingSongs }) {
  const [form, setForm] = useState({ title: '', duration: '', type_id: '' })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (song) setForm({ title: song.title, duration: song.duration, type_id: song.type_id || '' })
    else setForm({ title: '', duration: '', type_id: '' })
  }, [song])

  const validate = () => {
    const newErrors = {}
    if (!form.title.trim()) newErrors.title = 'Title is required'
    else {
      const exists = existingSongs.some(s => 
        s.title.toLowerCase() === form.title.trim().toLowerCase() && 
        (!song || s.id !== song.id)
      )
      if (exists) newErrors.title = 'Title already exists'
    }
    if (!form.type_id) newErrors.type_id = 'Type is required'
    if (!form.duration.trim()) newErrors.duration = 'Duration is required'
    else if (!/^\d{1,2}:\d{2}$/.test(form.duration.trim())) newErrors.duration = 'Invalid format (mm:ss)'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
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
          <h3 className="modal-title">{song ? 'Edit this mess' : 'New song, what could go wrong?'}</h3>
          <button className="btn btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name this masterpiece</label>
            <input
              className="input"
              value={form.title}
              onChange={e => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: '' }) }}
              placeholder="Title loading… maybe"
              style={errors.title ? { borderColor: 'var(--danger)' } : {}}
            />
            {errors.title && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.title}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Duration (mm:ss)</label>
            <input
              className="input"
              value={form.duration}
              onChange={e => { setForm({ ...form, duration: e.target.value }); setErrors({ ...errors, duration: '' }) }}
              placeholder="03:45"
              style={errors.duration ? { borderColor: 'var(--danger)' } : {}}
            />
            {errors.duration && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.duration}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              className="input"
              value={form.type_id}
              onChange={e => { setForm({ ...form, type_id: e.target.value }); setErrors({ ...errors, type_id: '' }) }}
              style={errors.type_id ? { borderColor: 'var(--danger)' } : {}}
            >
              <option value="">Select type</option>
              {types.map(t => (
                <option key={t.id} value={t.id}>{t.type}</option>
              ))}
            </select>
            {errors.type_id && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.type_id}</span>}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
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

export default function SongsPage() {
  const [songs, setSongs] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSong, setEditingSong] = useState(null)
  const [deleteSong, setDeleteSong] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const { success, error } = useToast()

  const fetchData = async () => {
    try {
      const [songsData, typesData] = await Promise.all([
        songsService.getAll(),
        songsService.getTypes()
      ])
      setSongs(songsData)
      setTypes(typesData)
    } catch (err) {
      error('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const handleSave = async (form) => {
    try {
      if (editingSong) {
        await songsService.update(editingSong.id, form)
        success('Chaos successfully updated')
      } else {
        await songsService.create(form)
        success('Fresh chaos added')
      }
      fetchData()
    } catch (err) {
      error('Error saving')
    }
  }

  const handleDelete = async () => {
    try {
      await songsService.delete(deleteSong.id)
      success('Noise deleted successfully')
      fetchData()
    } catch (err) {
      error('Error deleting')
    }
    setDeleteSong(null)
  }

  const filtered = songs.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    if (!sortConfig.key) return 0
    let aVal = sortConfig.key === 'type' ? (a.types?.type || '') : a[sortConfig.key]
    let bVal = sortConfig.key === 'type' ? (b.types?.type || '') : b[sortConfig.key]
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1
  const paginatedSongs = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, sortConfig])

  const SortHeader = ({ label, sortKey }) => (
    <th onClick={() => handleSort(sortKey)} style={{ cursor: 'pointer' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {label}
        {sortConfig.key === sortKey && (
          sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
        )}
      </span>
    </th>
  )

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem' }}>Songs that work (in theory)</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 150px', minWidth: '120px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              className="input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => { setEditingSong(null); setModalOpen(true) }}>
            <Plus size={18} /> New
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : sorted.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            {search ? 'No songs found' : 'No songs yet. Create the first one!'}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <SortHeader label="Title" sortKey="title" />
                <SortHeader label="Type" sortKey="type" />
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSongs.map(song => (
                <tr key={song.id}>
                  <td>{song.title}</td>
                  <td>{song.types?.type || '-'}</td>
                  <td style={{ width: '90px' }}>
                    <div className="table-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center' }}>
                      <button className="btn btn-ghost" onClick={() => { setEditingSong(song); setModalOpen(true) }} style={{ padding: '0.3rem' }}>
                        <Edit size={20} />
                      </button>
                      <button className="btn btn-ghost" onClick={() => setDeleteSong(song)} style={{ color: 'var(--danger)', padding: '0.3rem' }}>
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sorted.length > itemsPerPage && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
          <span style={{ color: 'var(--text-secondary)', padding: '0 0.5rem' }}>{currentPage} / {totalPages}</span>
          <button className="btn btn-secondary" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
        </div>
      )}

      {modalOpen && (
        <SongModal
          song={editingSong}
          types={types}
          existingSongs={songs}
          onClose={() => { setModalOpen(false); setEditingSong(null) }}
          onSave={handleSave}
        />
      )}

      {deleteSong && (
        <ConfirmModal
          message={`Delete this masterpiece: "${deleteSong.title}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteSong(null)}
        />
      )}
    </div>
  )
}