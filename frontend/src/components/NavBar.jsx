import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function NavBar({ user, onLogout }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('light');
  };

  const scrollTo = (id) => {
    if (location.pathname === '/') {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const goHome    = () => navigate('/');
  const goPredict = () => navigate('/predict');
  const goTrends  = () => navigate('/trends');
  const goCompare = () => navigate('/compare');

  const path = location.pathname;

  return (
    <nav>
      <div className="nav-inner">
        <div className="logo" onClick={goHome} style={{ cursor: 'pointer' }}>
          <div className="lmark">C</div>
          <span className="ltext">Cutoff<em>AI</em></span>
        </div>

        <div className="nav-mid">
          <button className="nlink" onClick={() => scrollTo('how')}>
            How it works
          </button>
          <button className="nlink" onClick={goPredict}
            style={path === '/predict' ? { color: 'var(--amber2)' } : {}}>
            Predictor
          </button>
          <button className="nlink" onClick={goTrends}
            style={path === '/trends' ? { color: 'var(--amber2)' } : {}}>
             Trends
          </button>
          <button className="nlink" onClick={goCompare}
            style={path === '/compare' ? { color: 'var(--amber2)' } : {}}>
             Compare
          </button>
          <button className="nlink" onClick={() => scrollTo('features')}>
            Features
          </button>
        </div>

        <div className="nav-end">
          <div className="live-tag">
            <span className="ldot"></span>
            2025 Live
          </div>

         

          {user && (
            <div className="user-menu-wrapper">
              <button className="user-avatar"
                onClick={() => setShowUserMenu(!showUserMenu)}
                title={user.name}>
                {user.name.charAt(0).toUpperCase()}
              </button>
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                  <hr style={{ margin: '8px 0', opacity: 0.2 }} />
                  <button onClick={onLogout} className="logout-btn">
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          )}

          <button className="ncta" onClick={goPredict}>Try Free →</button>
        </div>
      </div>
    </nav>
  );
}