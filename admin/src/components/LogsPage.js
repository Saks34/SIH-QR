import React, { useEffect, useMemo, useState } from 'react';
import { getAttendanceLogs } from '../services/api';

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    studentId: '',
    dateFrom: '',
    dateTo: '',
    limit: 200,
  });

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
        ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
        ...(filters.limit ? { limit: filters.limit } : {}),
      };
      const res = await getAttendanceLogs(params);
      setLogs(res?.attendance || []);
    } catch (e) {
      console.error('Failed to load logs', e);
      setError('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const formatTime = (t) => {
    if (!t) return '-';
    return new Date(`1970-01-01T${t}`).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const countByStatus = useMemo(() => {
    const out = { present: 0, total: logs.length };
    for (const r of logs) out.present += (r.status === 'present' ? 1 : 0);
    return out;
  }, [logs]);

  return (
    <div className="logs-page">
      <div className="logs-header">
        <h1 className="attendance-title">Attendance Logs</h1>
        <p className="attendance-subtitle">System-wide scan history</p>
      </div>

      <div className="filters" style={{ marginTop: 8 }}>
        <div className="filter-group">
          <label htmlFor="log-student-id">Student ID</label>
          <input id="log-student-id" name="studentId" className="filter-input" value={filters.studentId} onChange={handleChange} placeholder="e.g., STU001" />
        </div>
        <div className="filter-group">
          <label htmlFor="dateFrom">From</label>
          <input id="dateFrom" name="dateFrom" type="date" className="filter-input" value={filters.dateFrom} onChange={handleChange} />
        </div>
        <div className="filter-group">
          <label htmlFor="dateTo">To</label>
          <input id="dateTo" name="dateTo" type="date" className="filter-input" value={filters.dateTo} onChange={handleChange} />
        </div>
        <div className="filter-group">
          <label htmlFor="limit">Limit</label>
          <input id="limit" name="limit" type="number" min="1" max="1000" className="filter-input" value={filters.limit} onChange={handleChange} />
        </div>
        <button className="control-btn primary" onClick={loadLogs} disabled={loading}>
          {loading ? 'Loading...' : 'Apply'}
        </button>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">🧾</div>
          <div className="stat-content">
            <div className="stat-number">{logs.length}</div>
            <div className="stat-label">Records</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{countByStatus.present}</div>
            <div className="stat-label">Present</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Student Name</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Device</th>
              <th>Session Token</th>
            </tr>
          </thead>
          <tbody>
            {logs.length ? logs.map((r, i) => (
              <tr key={i}>
                <td>{r.studentId}</td>
                <td>{r.studentName || '-'}</td>
                <td>{formatDate(r.date)}</td>
                <td>{formatTime(r.time)}</td>
                <td>
                  <span className={`status-badge status-${r.status || 'present'}`}>
                    {(r.status || 'present') === 'present' ? 'Present' : r.status}
                  </span>
                </td>
                <td>{r.deviceId || '-'}</td>
                <td style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.sessionToken}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" className="no-data">No logs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogsPage;
