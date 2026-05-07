import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { setlistsService, songsService } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { Plus, ArrowLeft, Calendar, MapPin, GripVertical, Trash2, Download, X } from 'lucide-react'
import { format } from 'date-fns'
import { jsPDF } from 'jspdf'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableSong({ song, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: song.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: 'var(--bg-tertiary)',
        borderRadius: '0.5rem',
        marginBottom: '0.5rem',
      }}
    >
      <button {...attributes} {...listeners} style={{ cursor: 'grab', background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '0.25rem', touchAction: 'none' }}>
        <GripVertical size={18} />
      </button>
      <span style={{ color: 'var(--accent)', fontWeight: 500, minWidth: '28px', fontSize: '0.85rem' }}>{index + 1}</span>
      <span style={{ flex: 1, fontSize: '0.85rem' }}>{song.title}</span>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{song.duration}</span>
      <button onClick={() => onRemove(song.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}>
        <Trash2 size={18} />
      </button>
    </div>
  )
}

function AddSongModal({ setlistId, existingOrder, onClose, onAdd }) {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const allSongs = await songsService.getAll()
        const setlistSongs = await setlistsService.getSongs(setlistId)
        const existingIds = setlistSongs.map(s => s.songId)
        setSongs(allSongs.filter(s => !existingIds.includes(s.id)))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchSongs()
  }, [setlistId])

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggle = (songId) => {
    setSelected(prev => 
      prev.includes(songId)
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    )
  }

  const handleAdd = async () => {
    if (selected.length === 0) return
    try {
      await onAdd(selected)
      onClose()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Feed the setlist</h3>
          <button className="btn btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search songs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        ) : filteredSongs.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No more songs available</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', maxHeight: '300px', overflow: 'auto' }}>
              {filteredSongs.map(song => (
                <label
                  key={song.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: selected.includes(song.id) ? 'var(--accent)' : 'var(--bg-tertiary)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(song.id)}
                    onChange={() => handleToggle(song.id)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span style={{ flex: 1 }}>{song.title}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{song.duration}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {selected.length} selected
              </span>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAdd} disabled={selected.length === 0}>Add {selected.length > 0 && `(${selected.length})`}</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function EditSetlistModal({ setlist, onClose, onSave }) {
  const [form, setForm] = useState({ event_name: '', date: '', location: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (setlist) {
      setForm({
        event_name: setlist.event_name,
        date: setlist.date,
        location: setlist.location || ''
      })
    }
  }, [setlist])

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
          <h3 className="modal-title">Fix the setlist</h3>
          <button className="btn btn-ghost" onClick={onClose}><X size={20} /></button>
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
        <h3 className="modal-title" style={{ marginBottom: '1rem' }}>Confirm</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

export default function SetlistDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [setlist, setSetlist] = useState(null)
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingSong, setAddingSong] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleteSetlist, setDeleteSetlist] = useState(null)
  const [removeSong, setRemoveSong] = useState(null)
  const { success, error } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 0 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const fetchData = async () => {
    try {
      const [currentSetlist, songsData] = await Promise.all([
        setlistsService.getById(id),
        setlistsService.getSongs(id)
      ])
      setSetlist(currentSetlist)
      setSongs(songsData)
    } catch (err) {
      console.error(err)
      error('Error loading setlist')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = songs.findIndex(s => s.id === active.id)
      const newIndex = songs.findIndex(s => s.id === over.id)
      const newSongs = arrayMove(songs, oldIndex, newIndex)
      setSongs(newSongs)
      try {
        await setlistsService.reorderSongs(newSongs)
      } catch (err) {
        error('Error reordering songs')
        fetchData()
      }
    }
  }

  const handleAddSong = async (songIds) => {
    try {
      const startOrder = songs.length
      for (let i = 0; i < songIds.length; i++) {
        await setlistsService.addSong(id, songIds[i], startOrder + i)
      }
      success(`${songIds.length} song(s) added`)
      fetchData()
    } catch (err) {
      error('Error adding songs')
    }
  }

  const handleRemoveSong = async () => {
    if (!removeSong) return
    try {
      await setlistsService.removeSong(removeSong)
      success('Song removed from setlist')
      fetchData()
    } catch (err) {
      error('Error removing song')
    }
    setRemoveSong(null)
  }

  const handleSaveEdit = async (form) => {
    try {
      await setlistsService.update(id, form)
      success('Setlist updated')
      fetchData()
    } catch (err) {
      error('Error updating setlist')
    }
  }

  const handleDeleteSetlist = async () => {
    try {
      await setlistsService.delete(id)
      success('Setlist deleted')
      navigate('/setlists')
    } catch (err) {
      error('Error deleting setlist')
    }
    setDeleteSetlist(null)
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text(setlist.event_name, 20, 20)
    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(`${format(new Date(setlist.date), 'dd/MM/yyyy')}${setlist.location ? ` - ${setlist.location}` : ''}`, 20, 30)
    doc.setTextColor(0)
    doc.setFontSize(14)
    doc.text('Songs:', 20, 45)
    
    let y = 55
    songs.forEach((song, index) => {
      doc.setFontSize(11)
      doc.text(`${index + 1}. ${song.title} - ${song.duration}`, 20, y)
      y += 8
    })

    y += 10
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Total: ${songs.length} songs`, 20, y)

    doc.save(`${setlist.event_name.replace(/[^a-z0-9]/gi, '_')}_setlist.pdf`)
    success('PDF exported')
  }

  const calculateTotalDuration = () => {
    let total = 0
    songs.forEach(song => {
      const [min, sec] = song.duration.split(':').map(Number)
      total += min * 60 + sec
    })
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }

  if (loading) return <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>Loading...</p>
  if (!setlist) return <div className="card" style={{ textAlign: 'center', padding: '3rem' }}><p style={{ color: 'var(--text-secondary)' }}>Setlist not found</p></div>

  return (
    <div>
      <button onClick={() => navigate('/setlists')} className="btn btn-ghost" style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={18} /> Back
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem' }}>{setlist.event_name}</h3>
          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={16} /> {format(new Date(setlist.date), 'dd/MM/yyyy')}
            </span>
            {setlist.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={16} /> {setlist.location}
              </span>
            )}
            <span style={{ color: 'var(--accent)' }}>
              {songs.length} songs • {calculateTotalDuration()} total
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setEditing(true)} style={{ fontSize: '0.65rem', padding: '0.4rem 0.5rem' }}>Edit</button>
          <button className="btn btn-secondary" onClick={exportPDF} style={{ fontSize: '0.65rem', padding: '0.4rem 0.5rem' }}><Download size={14} /> PDF</button>
          <button className="btn btn-danger" onClick={() => setDeleteSetlist(true)} style={{ fontSize: '0.65rem', padding: '0.4rem 0.5rem' }}>Delete</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
        <h3 style={{ margin: 0 }}>Noise list</h3>
        <button className="btn btn-primary" onClick={() => setAddingSong(true)} style={{ fontSize: '0.65rem', padding: '0.4rem 0.5rem' }}>
          <Plus size={14} /> Add another hit
        </button>
      </div>

      {songs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Nothing to play… yet</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={songs.map(s => s.id)} strategy={verticalListSortingStrategy} style={{ touchAction: 'none' }}>
            {songs.map((song, index) => (
              <SortableSong key={song.id} song={song} index={index} onRemove={setRemoveSong} />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {addingSong && <AddSongModal setlistId={id} existingOrder={songs.length} onClose={() => setAddingSong(false)} onAdd={handleAddSong} />}
      {editing && <EditSetlistModal setlist={setlist} onClose={() => setEditing(false)} onSave={handleSaveEdit} />}
      {deleteSetlist && (
        <ConfirmModal
          message={`Are you really killing "${setlist.event_name}"? Zero regrets allowed.`}
          onConfirm={handleDeleteSetlist}
          onCancel={() => setDeleteSetlist(null)}
        />
      )}
      {removeSong && (
        <ConfirmModal
          message="Send this song home?"
          onConfirm={handleRemoveSong}
          onCancel={() => setRemoveSong(null)}
        />
      )}
    </div>
  )
}