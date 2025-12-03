import { useState } from 'react'
import { UserPlus, User, Mail, Lock, Shield, PenTool, Eye } from 'lucide-react'
import { authAPI } from '../services/api'
import './RegisterPage.css'

export default function RegisterPage({ onSwitch, onLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('viewer')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const roles = [
    { value: 'admin', label: 'Admin', icon: Shield, desc: 'Full access' },
    { value: 'editor', label: 'Editor', icon: PenTool, desc: 'Create & edit' },
    { value: 'viewer', label: 'Viewer', icon: Eye, desc: 'Read only' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) return setError('Passwords do not match')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    try {
      const res = await authAPI.register(name.trim(), email, password, role)
      if (res.success) {
        // After successful registration, switch back to login view
        // User will need to log in with their new credentials
        onSwitch()
      }
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  return (
    <div className="register-container">
      {/* Register Box */}
      <div className="register-box">
        {/* Title */}
        <div className="register-header">
          <h1>Create Account</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="register-form">
          {/* Full Name Field */}
          <div className="form-group">
            <label className="label-with-icon">
              <User size={18} className="label-icon" />
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Duc Duy"
              className="form-input"
            />
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label className="label-with-icon">
              <Mail size={18} className="label-icon" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="123@example.com"
              className="form-input"
            />
          </div>

          {/* Role Selection */}
          <div className="form-group">
            <label>Role</label>
            <div className="role-grid">
              {roles.map(r => (
                <div key={r.value} className="role-item">
                  <button
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`role-button ${role === r.value ? 'active' : ''}`}
                  >
                    <r.icon size={20} className="role-icon" />
                    <span className="role-label">{r.label}</span>
                  </button>
                  {role === r.value && (
                    <p className="role-desc">{r.desc}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="label-with-icon">
              <Lock size={18} className="label-icon" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
            />
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label className="label-with-icon">
              <Lock size={18} className="label-icon" />
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
            />
          </div>

          {/* Buttons */}
          <div className="button-group">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn btn-register"
            >
              <UserPlus size={18} />
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="register-footer">
          Already have an account?{' '}
          <button onClick={onSwitch} className="link-button">
            Sign In
          </button>
        </div>
      </div>
    </div>
  )
}