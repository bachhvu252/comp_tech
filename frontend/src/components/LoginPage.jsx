import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { authAPI } from '../services/api'
import WikiDashboard from './WikiDashboard'
import './LoginPage.css'

export default function LoginPage({ onSwitch, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authAPI.login(email, password)
      if (res.success) {
        // Get full user info from API
        const userRes = await authAPI.getMe()
        const user = userRes.user || res.user
        
        // Save token and user to localStorage
        if (res.token) {
          localStorage.setItem('token', res.token)
        }
        localStorage.setItem('user', JSON.stringify(user))
        
        // Set logged in user để hiển thị Dashboard
        setLoggedInUser(user)
        
        // Call onLogin callback nếu có
        if (onLogin) {
          onLogin(user)
        }
      } else {
        setError(res.message || 'Login failed')
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setLoggedInUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  // Nếu đã login thành công, hiển thị Dashboard
  if (loggedInUser) {
    return <WikiDashboard user={loggedInUser} onLogout={handleLogout} />
  }

  return (
    <div className="login-container">
      {/* Login Box */}
      <div className="login-box">
        {/* Title */}
        <div className="login-header">
          <h1>Log in</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="login-form">
          {/* User name Field */}
          <div className="form-group">
            <label>Email</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="form-input"
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="form-input password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="button-group">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn btn-login"
            >
              {loading ? 'Loading...' : 'Log in'}
            </button>
            <button
              type="button"
              className="btn btn-register"
              onClick={() => onSwitch && onSwitch('register')}
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}