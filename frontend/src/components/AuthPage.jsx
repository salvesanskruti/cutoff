import { useState } from 'react';

export default ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate inputs
      if (!formData.email || !formData.password) {
        setError('Email and password are required');
        setLoading(false);
        return;
      }

      if (!isLogin && !formData.fullName) {
        setError('Full name is required for signup');
        setLoading(false);
        return;
      }

      if (!isLogin && formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      // Get existing registered users
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');

      if (isLogin) {
        // LOGIN: Verify user exists and password matches
        const userExists = registeredUsers.find(u => u.email === formData.email);
        
        if (!userExists) {
          setError('Email not registered. Please sign up first');
          setLoading(false);
          return;
        }

        if (userExists.password !== formData.password) {
          setError('Invalid password');
          setLoading(false);
          return;
        }

        // Login successful
        const user = {
          email: userExists.email,
          name: userExists.name,
          token: 'sample_token_' + Date.now()
        };

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('authToken', user.token);
        onAuthSuccess(user);
      } else {
        // SIGNUP: Check if user already exists
        const userExists = registeredUsers.find(u => u.email === formData.email);
        
        if (userExists) {
          setError('Email already registered. Please sign in instead');
          setLoading(false);
          return;
        }

        // Register new user
        const newUser = {
          email: formData.email,
          name: formData.fullName,
          password: formData.password
        };

        registeredUsers.push(newUser);
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

        // Auto login after signup
        const user = {
          email: newUser.email,
          name: newUser.name,
          token: 'sample_token_' + Date.now()
        };

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('authToken', user.token);
        onAuthSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: '', password: '', confirmPassword: '', fullName: '' });
    setError('');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-bg">
        <div className="bg-grid"></div>
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div className="orb orb3"></div>
      </div>

      <div className="auth-container">
        <div className="auth-box">
          {/* Logo */}
          <div className="auth-logo">
            <div className="lmark">C</div>
            <span className="ltext">Cutoff<em>AI</em></span>
          </div>

          {/* Title */}
          <h1 className="auth-title">
            {isLogin ? 'Welcome Back' : 'Create Your Account'}
          </h1>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Sign in to your account to predict your colleges' 
              : 'Join us to get instant college predictions'}
          </p>

          {/* Error Message */}
          {error && (
            <div className="auth-error">
              <span style={{ color: '#fca5a5' }}>⚠️</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Full Name (Signup only) */}
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            {/* Confirm Password (Signup only) */}
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            )}

            {/* Remember Me / Forgot Password */}
            {isLogin && (
              <div className="form-options">
                <label className="form-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Remember me</span>
                </label>
                <a href="#" className="form-link">Forgot password?</a>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="auth-button"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>or</span>
          </div>

          {/* Social Buttons */}
          <div className="social-buttons">
            <button type="button" className="social-btn">
              <span>🔵</span> Google
            </button>
            <button type="button" className="social-btn">
              <span>📱</span> GitHub
            </button>
          </div>

          {/* Toggle Link */}
          <p className="auth-toggle">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={toggleMode}
              className="toggle-link"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>

          {/* Terms */}
          <p className="auth-terms">
            By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
          </p>
        </div>

        {/* Right Side Info */}
        <div className="auth-info">
          <div className="info-card">
            <div className="info-icon">🎯</div>
            <h3>Predict Accurately</h3>
            <p>AI-powered predictions with 99.8% accuracy</p>
          </div>
          <div className="info-card">
            <div className="info-icon">⚡</div>
            <h3>Instant Results</h3>
            <p>Get results in under a second</p>
          </div>
          <div className="info-card">
            <div className="info-icon">🔒</div>
            <h3>Your Data Safe</h3>
            <p>End-to-end encrypted and private</p>
          </div>
        </div>
      </div>
    </div>
  );
}
