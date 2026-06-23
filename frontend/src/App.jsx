import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import Footer from './components/Footer';
import StatusIndicator from './components/StatusIndicator';
import AuthPage from './components/AuthPage';
import PredictPage from './pages/PredictPage';
import ComparePage from './pages/ComparePage';
import CollegeDetailPage from './pages/CollegeDetailPage';
import SplineBackground from './components/SplineBackground';
import CompareBar from './components/CompareBar';
import React from 'react';
import TrendsPage from './pages/TrendsPage';
import trendsData from './data/cutoff_trends.json';


// ── Landing page ──
const LandingPage = () => {
  const pageRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.classList.contains('ru') && entry.isIntersecting) {
            entry.target.classList.add('in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px' }
    );
    document.querySelectorAll('.ru').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="page" ref={pageRef}>
      <div className="bg-wrap">
        <div className="bg-grid"></div>
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div className="orb orb3"></div>
      </div>
      <SplineBackground />
      <div style={{ position: 'relative', zIndex: 1 }} />
      <Hero />
      <HowItWorks />
      <Features />
      <Footer />
      <StatusIndicator />
    </div>
  );
}

// ── Main App ──
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Compare state — max 4 colleges
  const [compareSelected, setCompareSelected] = useState([]);

  // Restore auth
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const authToken = localStorage.getItem('authToken');
    if (savedUser && authToken) {
      try {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  const handleAuthSuccess = (userData) => { setUser(userData); setIsAuthenticated(true); };
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleToggleCompare = (college) => {
    setCompareSelected(prev => {
      const exists = prev.some(c => c.collegeId === college.collegeId);
      if (exists) return prev.filter(c => c.collegeId !== college.collegeId);
      if (prev.length >= 4) return prev;
      return [...prev, college];
    });
  };

  const handleRemoveFromCompare = (collegeId) => {
    setCompareSelected(prev => prev.filter(c => c.collegeId !== collegeId));
  };

  const handleClearCompare = () => setCompareSelected([]);

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <BrowserRouter>
      <NavBar user={user} onLogout={handleLogout} />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/predict"
          element={
            <PredictPage
              compareSelected={compareSelected}
              onToggleCompare={handleToggleCompare}
            />
          }
        />
        <Route path="/compare" element={<ComparePage data={trendsData} />} />
        <Route path="/college/:collegeId" element={<CollegeDetailPage />} />
        <Route path="/trends" element={<TrendsPage data={trendsData} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <CompareBar
        selected={compareSelected}
        onRemove={handleRemoveFromCompare}
        onClear={handleClearCompare}
      />
    </BrowserRouter>
  );
}