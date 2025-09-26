import React, { useState, useEffect } from 'react';
import { getTimetableData } from '../services/api';

const TimetableView = () => {
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Monday');

  useEffect(() => {
    loadTimetableData();
  }, []);

  const loadTimetableData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTimetableData();
      if (response.success) {
        setTimetableData(response.timetable);
      } else {
        setError('Failed to load timetable data');
      }
    } catch (error) {
      console.error('Error loading timetable:', error);
      setError('Error loading timetable data');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const getDayColor = (day) => {
    return day === getCurrentDay() ? '#4CAF50' : '#2196F3';
  };

  const getDayData = (day) => {
    return timetableData.find(d => d.day === day) || { day, slots: [] };
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (loading) {
    return (
      <div className="loading">
        <p>Loading timetable data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={loadTimetableData} className="control-btn primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="timetable">
      <div className="timetable-header">
        <h1 className="timetable-title">Class Timetable</h1>
        <p className="timetable-subtitle">
          View and manage class schedules
        </p>
      </div>

      {/* Day Navigation */}
      <div className="day-navigation">
        {days.map(day => (
          <button
            key={day}
            className={`day-btn ${selectedDay === day ? 'active' : ''}`}
            onClick={() => setSelectedDay(day)}
            style={{
              borderBottomColor: selectedDay === day ? getDayColor(day) : 'transparent'
            }}
          >
            {day}
            {day === getCurrentDay() && <span className="today-indicator">Today</span>}
          </button>
        ))}
      </div>

      {/* Timetable Content */}
      <div className="timetable-content">
        <div className="day-section">
          <h2 
            className="day-title"
            style={{ color: getDayColor(selectedDay) }}
          >
            {selectedDay}
            {selectedDay === getCurrentDay() && (
              <span className="current-day-badge">Current Day</span>
            )}
          </h2>
          
          {getDayData(selectedDay).slots.length > 0 ? (
            <div className="slots-grid">
              {getDayData(selectedDay).slots.map((slot, index) => (
                <div key={index} className="slot-card">
                  <div className="slot-time">{slot.time}</div>
                  <div className="slot-subject">{slot.subject}</div>
                  <div className="slot-room">Room: {slot.room}</div>
                  <div className="slot-students">
                    Students: {slot.studentCount || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-slots">
              <div className="no-slots-icon">📅</div>
              <p>No classes scheduled for {selectedDay}</p>
            </div>
          )}
        </div>
      </div>

      {/* Timetable Summary */}
      <div className="timetable-summary">
        <h3>Weekly Summary</h3>
        <div className="summary-grid">
          {days.map(day => {
            const dayData = getDayData(day);
            const isCurrentDay = day === getCurrentDay();
            return (
              <div 
                key={day} 
                className={`summary-card ${isCurrentDay ? 'current' : ''}`}
              >
                <div className="summary-day">{day}</div>
                <div className="summary-count">
                  {dayData.slots.length} class{dayData.slots.length !== 1 ? 'es' : ''}
                </div>
                {isCurrentDay && <div className="current-indicator">Today</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="timetable-actions">
        <button className="control-btn primary">
          📝 Edit Timetable
        </button>
        <button className="control-btn secondary">
          📊 View Statistics
        </button>
        <button className="control-btn secondary">
          📄 Export Schedule
        </button>
      </div>
    </div>
  );
};

export default TimetableView;
