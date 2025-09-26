import React from 'react';

const Dashboard = ({ onNavigate }) => {
  const dashboardCards = [
    {
      icon: '📱',
      title: 'QR Code Generator',
      description: 'Generate QR codes for attendance marking. Codes auto-refresh every 30 seconds with unique tokens.',
      view: 'qr-generator'
    },
    {
      icon: '👥',
      title: 'Attendance List',
      description: 'View and manage student attendance records. See who marked attendance and when.',
      view: 'attendance-list'
    },
    {
      icon: '📅',
      title: 'Timetable Management',
      description: 'View and manage class schedules. See current timetable and upcoming classes.',
      view: 'timetable'
    },
    {
      icon: '📊',
      title: 'Analytics',
      description: 'View attendance statistics and reports. Track attendance trends and patterns.',
      view: 'analytics'
    }
  ];

  const handleCardClick = (view) => {
    onNavigate(view);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Admin Dashboard</h1>
        <p className="dashboard-subtitle">
          Manage student attendance and class schedules efficiently
        </p>
      </div>

      <div className="dashboard-grid">
        {dashboardCards.map((card, index) => (
          <div
            key={index}
            className="dashboard-card"
            onClick={() => handleCardClick(card.view)}
          >
            <div className="card-icon">{card.icon}</div>
            <h3 className="card-title">{card.title}</h3>
            <p className="card-description">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="dashboard-info">
        <h3>Quick Stats</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">156</span>
            <span className="stat-label">Total Students</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">89%</span>
            <span className="stat-label">Avg Attendance</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">12</span>
            <span className="stat-label">Active Classes</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">5</span>
            <span className="stat-label">Pending Tasks</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
