import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SongsPage from './pages/SongsPage'
import SetlistsPage from './pages/SetlistsPage'
import SetlistDetailPage from './pages/SetlistDetailPage'
import StatsPage from './pages/StatsPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('bouquet_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('bouquet_user')
    setUser(null)
  }

  if (loading) {
    return null
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <Routes>
      <Route path="/" element={<Layout onLogout={handleLogout} user={user} />}>
        <Route index element={<HomePage />} />
        <Route path="songs" element={<SongsPage />} />
        <Route path="setlists" element={<SetlistsPage />} />
        <Route path="setlists/:id" element={<SetlistDetailPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}