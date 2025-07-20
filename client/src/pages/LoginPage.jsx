import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Login.css';

export default function Login() {
  const { login, loading, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'public' // Default role
  });

  const roles = [
    'admin',
    'manufacturer',
    'distributor',
    'wholesaler',
    'retailer',
    'pharmacy',
    'public'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (authError) setAuthError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({
        ...formData,
        role: formData.role // Explicitly include role in credentials
      });
    } catch (error) {
      // Error handling is already done in AuthContext
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>MedChain Login</h2>
        <p className="login-subtitle">Secure access to your account</p>
        
        {authError && (
          <div className="alert alert-error">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              disabled={loading}
              className="role-select"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/select-role" className="link">
              Register here
            </Link>
          </p>
          <p>
            <Link to="/forgot-password" className="link">
              Forgot password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}