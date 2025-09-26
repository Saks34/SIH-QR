import axios from 'axios';

// Base URL for the backend API (configurable via env)
// Set REACT_APP_API_URL in admin/.env, e.g. http://localhost:4000/api
// Our server exposes routes under /api (see server/server.js)
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// Socket base (remove trailing /api if present)
export const SOCKET_URL = (process.env.REACT_APP_SOCKET_URL || BASE_URL).replace(/\/?api$/, '');

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// QR Token API (server generates a single-use token for attendance)
export const generateQRToken = async () => {
  try {
    // POST /api/attendance/generate-qr -> { success, token, expiresAt }
    const response = await api.post('/attendance/generate-qr');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Attendance API (server supports GET /api/attendance/:studentId)
export const getAttendanceForStudent = async (studentId, days = 7) => {
  try {
    const response = await api.get(`/attendance/${encodeURIComponent(studentId)}`, { params: { days } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin: fetch attendance logs across students with optional filters
// params: { studentId?, dateFrom?, dateTo?, limit? }
export const getAttendanceLogs = async (params = {}) => {
  try {
    const response = await api.get('/attendance', { params });
    return response.data; // { success, attendance: [...] }
  } catch (error) {
    throw error;
  }
};

// Timetable API
export const getTimetableData = async () => {
  try {
    // For demo purposes, return mock data
    // In real app, this would call the backend API
    const mockData = {
      success: true,
      timetable: [
        {
          day: 'Monday',
          slots: [
            { time: '09:00-10:00', subject: 'Data Structures', room: 'A101', studentCount: 45 },
            { time: '10:00-11:00', subject: 'Algorithms', room: 'A102', studentCount: 42 },
            { time: '11:00-12:00', subject: 'Database Systems', room: 'A103', studentCount: 38 },
            { time: '14:00-15:00', subject: 'Web Development', room: 'A104', studentCount: 40 }
          ]
        },
        {
          day: 'Tuesday',
          slots: [
            { time: '09:00-10:00', subject: 'Operating Systems', room: 'B101', studentCount: 44 },
            { time: '10:00-11:00', subject: 'Computer Networks', room: 'B102', studentCount: 41 },
            { time: '15:00-16:00', subject: 'Software Engineering', room: 'B103', studentCount: 39 }
          ]
        },
        {
          day: 'Wednesday',
          slots: [
            { time: '09:00-10:00', subject: 'Machine Learning', room: 'C101', studentCount: 35 },
            { time: '11:00-12:00', subject: 'Artificial Intelligence', room: 'C102', studentCount: 33 },
            { time: '14:00-15:00', subject: 'Data Science', room: 'C103', studentCount: 37 }
          ]
        },
        {
          day: 'Thursday',
          slots: [
            { time: '09:00-10:00', subject: 'Mobile Development', room: 'D101', studentCount: 36 },
            { time: '10:00-11:00', subject: 'Cloud Computing', room: 'D102', studentCount: 34 },
            { time: '15:00-16:00', subject: 'Cybersecurity', room: 'D103', studentCount: 32 }
          ]
        },
        {
          day: 'Friday',
          slots: [
            { time: '09:00-10:00', subject: 'Project Management', room: 'E101', studentCount: 40 },
            { time: '11:00-12:00', subject: 'Research Methods', room: 'E102', studentCount: 28 },
            { time: '14:00-15:00', subject: 'Internship Seminar', room: 'E103', studentCount: 30 }
          ]
        },
        {
          day: 'Saturday',
          slots: [
            { time: '10:00-12:00', subject: 'Lab Session', room: 'Lab1', studentCount: 25 },
            { time: '14:00-16:00', subject: 'Workshop', room: 'Lab2', studentCount: 20 }
          ]
        },
        {
          day: 'Sunday',
          slots: []
        }
      ]
    };
    return mockData;
  } catch (error) {
    throw error;
  }
};

export default api;
