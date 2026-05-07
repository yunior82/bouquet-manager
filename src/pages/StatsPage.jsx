import { useState, useEffect, useRef } from 'react'
import { AgCharts } from 'ag-charts-community'
import { ModuleRegistry, AllCommunityModule } from 'ag-charts-community'
import { songsService, setlistsService } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { Calendar } from 'lucide-react'
import { format, subDays } from 'date-fns'

ModuleRegistry.registerModules([AllCommunityModule])

export default function StatsPage() {
  const chartContainerRef = useRef(null)
  const chartInstanceRef = useRef(null)
  const pieChartContainerRef = useRef(null)
  const pieChartInstanceRef = useRef(null)
  const topSongsContainerRef = useRef(null)
  const topSongsInstanceRef = useRef(null)
  const today = new Date()
  const thirtyDaysAgo = subDays(today, 30)
  
  const [loading, setLoading] = useState(true)
  const [setlists, setSetlists] = useState([])
  const [dateRange, setDateRange] = useState({ 
    start: format(thirtyDaysAgo, 'yyyy-MM-dd'), 
    end: format(today, 'yyyy-MM-dd') 
  })
  const [renderTrigger, setRenderTrigger] = useState(0)
  const { error } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!loading && setlists.length > 0) {
      if (renderTrigger > 0) {
        renderChart()
        renderPieChart()
        renderTopSongsChart()
      }
    }
  }, [setlists, renderTrigger, loading])

  useEffect(() => {
    if (!loading && setlists.length > 0 && !renderTrigger) {
      setRenderTrigger(1)
    }
  }, [setlists, loading])

  const handleGenerate = () => {
    if (!dateRange.start || !dateRange.end) {
      error('Please select both start and end dates')
      return
    }
    setRenderTrigger(prev => prev + 1)
  }

  const fetchData = async () => {
    try {
      const data = await setlistsService.getAll()
      const setlistsWithSongs = await Promise.all(
        data.map(async (s) => {
const songsData = await setlistsService.getSongs(s.id)
          const coverCount = songsData.filter(song => song.type && song.type.toLowerCase().includes('cover')).length
          const originalCount = songsData.filter(song => song.type && song.type.toLowerCase().includes('original')).length
          return {
            ...s, 
            songCount: songsData.length,
            coverCount,
            originalCount,
            songs: songsData
          }
        })
      )
      setSetlists(setlistsWithSongs)
    } catch (err) {
      error('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const generateColor = (index) => {
    const colors = [
      '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444',
      '#3b82f6', '#10b981', '#f97316', '#6366f1', '#84cc17',
      '#06b6d4', '#d946ef', '#8b5cf6', '#f43f5e', '#06b6d4'
    ]
    return colors[index % colors.length]
  }

  const renderChart = () => {
    if (!chartContainerRef.current) return

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy()
      chartInstanceRef.current = null
    }

    chartContainerRef.current.innerHTML = ''

    const filtered = setlists.filter(s => {
      if (!dateRange.start || !dateRange.end) return true
      const setlistDate = new Date(s.date)
      return setlistDate >= new Date(dateRange.start) && setlistDate <= new Date(dateRange.end)
    })

    const chartData = filtered
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(s => ({
        setlist: s.event_name,
        songs: s.songCount || 0,
        date: s.date
      }))

    if (chartData.length === 0) {
      chartContainerRef.current.innerHTML = '<p style="color: #a1a1aa; text-align: center; padding: 2rem;">No data found for selected date range</p>'
      return
    }

    const options = {
      data: chartData,
      title: { text: 'Songs per Setlist', color: '#f4f4f5' },
      background: { fill: '#1a1a24' },
      padding: { top: 40, right: 40, bottom: 60, left: 40 },
      axes: [
        {
          type: 'category',
          position: 'bottom',
          label: { color: '#a1a1aa', rotation: -45 },
          gridStyle: [{ stroke: '#3f3f46' }],
          line: { stroke: '#3f3f46' },
        },
        {
          type: 'number',
          position: 'left',
          label: { color: '#a1a1aa' },
          gridStyle: [{ stroke: '#3f3f46' }],
          line: { stroke: '#3f3f46' },
        },
      ],
      series: chartData.map((item, index) => ({
        data: [item],
        type: 'bar',
        xKey: 'setlist',
        yKey: 'songs',
        fill: generateColor(index),
        stroke: generateColor(index),
        grouped: false,
        tooltip: {
          renderer: () => `<div style="padding: 8px;">${item.setlist}<br/>${item.songs} songs - ${item.date}</div>`
        },
        label: { color: '#f4f4f5', formatter: (params) => params.value.toString() },
      })),
    }

    try {
      const chartElement = document.createElement('div')
      chartElement.style.width = '100%'
      chartElement.style.height = '400px'
      chartContainerRef.current.appendChild(chartElement)
      
      const chart = AgCharts.create({
        ...options,
        container: chartElement
      })
      
      chartInstanceRef.current = chart
    } catch (err) {
      console.error('Chart error:', err)
      chartContainerRef.current.innerHTML = `<p style="color: #ef4444; padding: 2rem;">Error: ${err.message}</p>`
    }
  }

  const renderPieChart = () => {
    if (!pieChartContainerRef.current) return

    if (pieChartInstanceRef.current) {
      pieChartInstanceRef.current.destroy()
      pieChartInstanceRef.current = null
    }

    pieChartContainerRef.current.innerHTML = ''

    const filtered = setlists.filter(s => {
      if (!dateRange.start || !dateRange.end) return true
      const setlistDate = new Date(s.date)
      return setlistDate >= new Date(dateRange.start) && setlistDate <= new Date(dateRange.end)
    })

    const totalCovers = filtered.reduce((sum, s) => sum + (s.coverCount || 0), 0)
    const totalOriginals = filtered.reduce((sum, s) => sum + (s.originalCount || 0), 0)
    const total = totalCovers + totalOriginals

    if (total === 0) {
      pieChartContainerRef.current.innerHTML = '<p style="color: #a1a1aa; text-align: center; padding: 2rem;">No data found for selected date range</p>'
      return
    }

    const pieData = [
      { type: 'Covers', value: totalCovers },
      { type: 'Originals', value: totalOriginals }
    ]

    const pieOptions = {
      data: pieData,
      title: { text: 'Covers vs Originals', color: '#f4f4f5' },
      background: { fill: '#1a1a24' },
      padding: { top: 40, right: 40, bottom: 40, left: 40 },
      series: [
        {
          type: 'donut',
          angleKey: 'value',
          labelKey: 'type',
          innerRadius: 0.6,
          strokeWidth: 0,
          sectorSpacing: 2,
          calloutLabel: { enabled: true },
          sectorLabel: {
            enabled: true,
            formatter: ({ value }) => {
              const percentage = Math.round((value / total) * 100)
              return `${percentage}%`
            }
          },
          tooltip: {
            renderer: ({ datum }) => {
              const percentage = Math.round((datum.value / total) * 100)
              return `<div style="padding: 8px;">${datum.type}: ${datum.value} (${percentage}%)</div>`
            }
          }
        }
      ],
      legend: {
        position: 'bottom',
        item: { label: { color: '#a1a1aa' } }
      }
    }

    try {
      const chartElement = document.createElement('div')
      chartElement.style.width = '100%'
      chartElement.style.height = '400px'
      pieChartContainerRef.current.appendChild(chartElement)
      
      const chart = AgCharts.create({
        ...pieOptions,
        container: chartElement
      })
      
      pieChartInstanceRef.current = chart
    } catch (err) {
      console.error('Pie chart error:', err)
      pieChartContainerRef.current.innerHTML = `<p style="color: #ef4444; padding: 2rem;">Error: ${err.message}</p>`
    }
  }

  const renderTopSongsChart = () => {
    if (!topSongsContainerRef.current) return

    if (topSongsInstanceRef.current) {
      topSongsInstanceRef.current.destroy()
      topSongsInstanceRef.current = null
    }

    topSongsContainerRef.current.innerHTML = ''

    const filtered = setlists.filter(s => {
      if (!dateRange.start || !dateRange.end) return true
      const setlistDate = new Date(s.date)
      return setlistDate >= new Date(dateRange.start) && setlistDate <= new Date(dateRange.end)
    })

    if (filtered.length === 0) {
      topSongsContainerRef.current.innerHTML = '<p style="color: #a1a1aa; text-align: center; padding: 2rem;">No data found for selected date range</p>'
      return
    }

    const songCounts = {}
    filtered.forEach(setlist => {
      const songs = setlist.songs || []
      songs.forEach(song => {
        if (song.title) {
          songCounts[song.title] = (songCounts[song.title] || 0) + 1
        }
      })
    })

    const sortedSongs = Object.entries(songCounts)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    if (sortedSongs.length === 0) {
      topSongsContainerRef.current.innerHTML = '<p style="color: #a1a1aa; text-align: center; padding: 2rem;">No song data found</p>'
      return
    }

    const topSongsOptions = {
      data: sortedSongs,
      title: { text: 'Top 10 Most Played Songs', color: '#f4f4f5' },
      background: { fill: '#1a1a24' },
      padding: { top: 40, right: 40, bottom: 40, left: 40 },
      series: [
        {
          type: 'pie',
          calloutLabelKey: 'title',
          angleKey: 'count',
          sectorSizeKey: 'count',
          outerRadius: '60%',
          innerRadius: '30%',
          strokeWidth: 0,
          sectorLabel: {
            enabled: true,
            formatter: ({ datum }) => `${datum.count}x`
          },
          tooltip: {
            renderer: ({ datum }) => {
              return `<div style="padding: 8px;"><strong>${datum.title}</strong><br/>Played: ${datum.count} times</div>`
            }
          }
        }
      ],
      legend: {
        enabled: false
      }
    }

    try {
      const chartElement = document.createElement('div')
      chartElement.style.width = '100%'
      chartElement.style.height = '500px'
      topSongsContainerRef.current.appendChild(chartElement)
      
      const chart = AgCharts.create({
        ...topSongsOptions,
        container: chartElement
      })
      
      topSongsInstanceRef.current = chart
    } catch (err) {
      console.error('Top songs chart error:', err)
      topSongsContainerRef.current.innerHTML = `<p style="color: #ef4444; padding: 2rem;">Error: ${err.message}</p>`
    }
  }

  if (loading) {
    return <p style={{ color: '#a1a1aa', textAlign: 'center', marginTop: '2rem' }}>Loading...</p>
  }

  return (
    <div>
      <h3 style={{ marginBottom: '1.5rem' }}>Live chaos analytics</h3>
      
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Calendar size={20} style={{ color: '#8b5cf6' }} />
          <span style={{ fontWeight: 500 }}>Select the damage period</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa', fontSize: '0.875rem' }}>Start Date</label>
            <input
              type="date"
              className="input"
              value={dateRange.start}
              onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa', fontSize: '0.875rem' }}>End Date</label>
            <input
              type="date"
              className="input"
              value={dateRange.end}
              onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" onClick={handleGenerate}>
            Generate
          </button>
        </div>
      </div>

      <div className="card" ref={chartContainerRef} style={{ minHeight: '400px', padding: 0 }}>
      </div>

      <div className="card" ref={pieChartContainerRef} style={{ minHeight: '400px', padding: 0, marginTop: '1.5rem' }}>
      </div>

      <div className="card" ref={topSongsContainerRef} style={{ minHeight: '500px', padding: 0, marginTop: '1.5rem' }}>
      </div>
    </div>
  )
}