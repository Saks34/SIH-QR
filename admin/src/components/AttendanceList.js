  import React, { useState, useEffect } from 'react';
  import { getAttendanceForStudent } from '../services/api';

  const AttendanceList = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studentId, setStudentId] = useState('STU001');
  const [days, setDays] = useState(7);

  useEffect(() => {
    loadAttendanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAttendanceForStudent(studentId, days);
      // Server returns: { success, records: [{ studentId, deviceId, date: 'YYYY-MM-DD', time: 'HH:mm:ss', ... }], percentage, ... }
      const normalized = (response?.records || []).map(r => ({
        studentId: r.studentId,
        date: r.date,
        time: r.time,
        status: r.status || 'present',
        deviceId: r.deviceId || '-',
        ip: r.ip || '-',
      }));
      setAttendanceData(normalized);
    } catch (error) {
      console.error('Error loading attendance:', error);
      setError('Error loading attendance data');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = attendanceData;

  const getStatusBadge = (status) => {
    return (
      <span className={`status-badge status-${status}`}>
        {status === 'present' ? 'Present' : 'Absent'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    // dateString is YYYY-MM-DD
    const d = new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    // timeString is HH:mm:ss
    const d = new Date(`1970-01-01T${timeString}`);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const stats = {
    total: attendanceData.length,
    present: attendanceData.length,
    absent: 0,
    percentage: attendanceData.length > 0 ? 100 : 0,
  };

  if (loading) {
    return (
      <div className="loading">
        <p>Loading attendance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={loadAttendanceData} className="control-btn primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="attendance-list">
      <div className="attendance-header">
        <h1 className="attendance-title">Attendance List</h1>
        <p className="attendance-subtitle">
          View and manage student attendance records
        </p>
      </div>

      {/* Inputs */}
      <div className="filters" style={{ marginTop: 8 }}>
        <div className="filter-group">
          <label htmlFor="student-id">Student ID:</label>
          <input id="student-id" className="filter-input" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
        </div>
        <div className="filter-group">
          <label htmlFor="days">Days:</label>
          <input id="days" className="filter-input" type="number" min="1" max="60" value={days} onChange={(e) => setDays(parseInt(e.target.value || '7', 10))} />
        </div>
        <button className="control-btn primary" onClick={loadAttendanceData}>Load</button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Records</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.present}</div>
            <div className="stat-label">Present</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-number">{stats.absent}</div>
            <div className="stat-label">Absent</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{stats.percentage}%</div>
            <div className="stat-label">Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Date (Marked)</th>
              <th>Time (Marked)</th>
              <th>Status</th>
              <th>Device ID</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((record, index) => (
                <tr key={index}>
                  <td>{record.studentId}</td>
                  <td>{formatDate(record.date)}</td>
                  <td>{formatTime(record.time)}</td>
                  <td>{getStatusBadge(record.status)}</td>
                  <td>{record.deviceId}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  No attendance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Export Button */}
      <div className="export-section">
        <button className="control-btn primary">
          📊 Export to Excel
        </button>
        <button className="control-btn secondary">
          📄 Generate Report
        </button>
      </div>
    </div>
  );
};

export default AttendanceList;
