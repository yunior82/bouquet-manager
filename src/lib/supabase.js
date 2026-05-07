import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export const songsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('songs')
      .select('*, types(type)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getTypes() {
    const { data, error } = await supabase
      .from('types')
      .select('*')
      .order('type', { ascending: true })
    if (error) throw error
    return data
  },

  async create(song) {
    const { data, error } = await supabase
      .from('songs')
      .insert([song])
      .select()
    if (error) throw error
    return data[0]
  },

  async update(id, song) {
    const { data, error } = await supabase
      .from('songs')
      .update(song)
      .eq('id', id)
      .select()
    if (error) throw error
    return data[0]
  },

  async delete(id) {
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

export const setlistsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('setlists')
      .select('*')
      .order('date', { ascending: false })
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('setlists')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(setlist) {
    const { data, error } = await supabase
      .from('setlists')
      .insert([setlist])
      .select()
    if (error) throw error
    return data[0]
  },

  async update(id, setlist) {
    const { data, error } = await supabase
      .from('setlists')
      .update(setlist)
      .eq('id', id)
      .select()
    if (error) throw error
    return data[0]
  },

  async delete(id) {
    const { error } = await supabase
      .from('setlists')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async getSongs(setlistId) {
    const { data, error } = await supabase
      .from('setlist_songs')
      .select(`
        id,
        order_index,
        songs (
          id,
          title,
          duration,
          type_id,
          types (type)
        )
      `)
      .eq('setlist_id', setlistId)
      .order('order_index')
    if (error) throw error
    return data.map(item => ({
      id: item.id,
      songId: item.songs.id,
      title: item.songs.title,
      duration: item.songs.duration,
      typeId: item.songs.type_id,
      type: item.songs.types?.type,
      orderIndex: item.order_index
    }))
  },

  async addSong(setlistId, songId, orderIndex) {
    const { data, error } = await supabase
      .from('setlist_songs')
      .insert([{
        setlist_id: setlistId,
        song_id: songId,
        order_index: orderIndex
      }])
      .select()
    if (error) throw error
    return data[0]
  },

  async removeSong(id) {
    const { error } = await supabase
      .from('setlist_songs')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async updateOrder(songId, newIndex) {
    const { error } = await supabase
      .from('setlist_songs')
      .update({ order_index: newIndex })
      .eq('id', songId)
    if (error) throw error
  },

  async reorderSongs(songs) {
    const updates = songs.map((song, index) => ({
      id: song.id,
      order_index: index
    }))
    
    const promises = updates.map(update => 
      supabase
        .from('setlist_songs')
        .update({ order_index: update.order_index })
        .eq('id', update.id)
    )
    
    const results = await Promise.all(promises)
    const errors = results.filter(r => r.error)
    if (errors.length > 0) throw errors[0].error
  }
}