import { useState, useEffect } from 'react'
import { authAPI } from './services/api'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import WikiDashboard from './components/WikiDashboard'

export default function App() {
  const [user, setUser] = useState(null)
  const [authView, setAuthView] = useState('login')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authAPI.isAuthenticated()) {
      authAPI.getMe().then(r => r.success && setUser(r.user)).catch(() => authAPI.logout()).finally(() => setLoading(false))
    } else setLoading(false)
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  if (!user) return authView === 'login' 
    ? <LoginPage onSwitch={() => setAuthView('register')} onLogin={setUser} />
    : <RegisterPage onSwitch={() => setAuthView('login')} onLogin={setUser} />

  return <WikiDashboard user={user} onLogout={() => { authAPI.logout(); setUser(null) }} />
}