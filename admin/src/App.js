import React, { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import QRGenerator from './components/QRGenerator';
import AttendanceList from './components/AttendanceList';
import TimetableView from './components/TimetableView';
import LogsPage from './components/LogsPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('adminUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('adminUser');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'qr-generator':
        return <QRGenerator />;
      case 'attendance-list':
        return <AttendanceList />;
      case 'timetable':
        return <TimetableView />;
      case 'logs':
        return <LogsPage />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>SIH Admin Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {user?.name || 'Admin'}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentView('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-btn ${currentView === 'qr-generator' ? 'active' : ''}`}
          onClick={() => setCurrentView('qr-generator')}
        >
          📱 QR Generator
        </button>
        <button
          className={`nav-btn ${currentView === 'attendance-list' ? 'active' : ''}`}
          onClick={() => setCurrentView('attendance-list')}
        >
          👥 Attendance List
        </button>
        <button
          className={`nav-btn ${currentView === 'timetable' ? 'active' : ''}`}
          onClick={() => setCurrentView('timetable')}
        >
          📅 Timetable
        </button>
        <button
          className={`nav-btn ${currentView === 'logs' ? 'active' : ''}`}
          onClick={() => setCurrentView('logs')}
        >
          🧾 Logs
        </button>
      </nav>

      <main className="app-main">
        {renderCurrentView()}
      </main>
    </div>
  );
}

export default App;