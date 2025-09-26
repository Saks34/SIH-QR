const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:19006'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// --- AI Chatbot (Google GenAI) integration ---
let _aiClientPromise = null;
async function getAIClient() {
  if (_aiClientPromise) return _aiClientPromise;
  _aiClientPromise = (async () => {
    const mod = await import('@google/genai');
    const { GoogleGenAI } = mod;
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn('GoogleGenAI API_KEY is not set. /ai route will not work until configured.');
    }
    return new GoogleGenAI({ apiKey });
  })();
  return _aiClientPromise;
}

function buildPrompt(query, role) {
  if (role === 'friend') {
    return `You are a friendly companion. Reply in a short, natural, and clear way. Focus on answering the query directly, avoiding unnecessary explanations, stories, or extra context. You can also ask a follow-up question to keep the conversation going. Here is the user's message: "${query}"`;
  } else if (role === 'tutor') {
    return `You are a strict and focused tutor. Your task is to explain the concept clearly and thoroughly, provide short feedback like "Good!", "Well done!", or "Incorrect, try again", and guide the learner to understand. Do NOT include casual conversation, stories, or unrelated chat. Structure your output in JSON format for display in revision cards with phases or sections. Each card should have:
{
  "title": "Phase/Topic Name",
  "keyPoints": ["Important formula or definition", "Another key point", ...],
  "example": "Optional concise example or application",
  "feedback": "Good/Well done/Incorrect"
}
Provide enough phases to cover the topic fully but keep each phase concise. Here is the user's message: "${query}"`;
  }
  return String(query || '');
}

// Health check endpoint for connectivity tests
app.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString(), port: PORT });
});

// MongoDB (native driver)
const MONGODB_URI = process.env.MONGODB_URI|| 'mongodb+srv://root:root@cluster0.nbqpit4.mongodb.net/qrcode?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(MONGODB_URI);
let db;
let Students;
let Attendance;
let Timetable;
let Tests;
let QRTokens;

async function initializeIndexes() {
  await Students.createIndex({ studentId: 1 }, { unique: true });
  // Ensure email index does not fail due to existing nulls by using a partial unique index
  try {
    const indexes = await Students.indexes();
    const hasEmailIndex = indexes.find((i) => i.name === 'email_1');
    if (hasEmailIndex) {
      await Students.dropIndex('email_1');
    }
  } catch (e) {
    // ignore if index doesn't exist
  }
  await Students.createIndex(
    { email: 1 },
    {
      unique: true,
      partialFilterExpression: { email: { $exists: true, $type: 'string' } },
    }
  );
  // Prevent duplicate attendance per session per device
  await Attendance.createIndex({ studentId: 1, deviceId: 1, sessionToken: 1 }, { unique: true });
  // TTL for QR tokens and unique token
  await QRTokens.createIndex({ token: 1 }, { unique: true });
  await QRTokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}

// Dummy data initialization
const initializeDummyData = async () => {
  try {
    // Clear existing data (demo only)
    await Students.deleteMany({});
    await Timetable.deleteMany({});
    await Tests.deleteMany({});

    // Create dummy students
    const students = [
      {
        studentId: 'STU001',
        name: 'John Doe',
        email: 'john@example.com',
        department: 'Computer Science',
        year: 2023,
        deviceId: 'device123'
      },
      {
        studentId: 'STU002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        department: 'Information Technology',
        year: 2023,
        deviceId: 'device456'
      }
    ];

    await Students.insertMany(students);

    // Create dummy timetable
    const timetable = [
      {
        studentId: 'STU001',
        day: 'Monday',
        slots: [
          { time: '09:00-10:00', subject: 'Data Structures', room: 'A101', instructor: 'Dr. Smith', type: 'lecture' },
          { time: '10:00-11:00', subject: 'Algorithms', room: 'A102', instructor: 'Prof. Johnson', type: 'lecture' },
          { time: '11:00-12:00', subject: 'Database Systems', room: 'A103', instructor: 'Dr. Brown', type: 'lecture' },
          { time: '14:00-15:00', subject: 'Web Development', room: 'A104', instructor: 'Ms. Davis', type: 'lab' }
        ]
      },
      {
        studentId: 'STU001',
        day: 'Tuesday',
        slots: [
          { time: '09:00-10:00', subject: 'Operating Systems', room: 'B101', instructor: 'Dr. Wilson', type: 'lecture' },
          { time: '10:00-11:00', subject: 'Computer Networks', room: 'B102', instructor: 'Prof. Miller', type: 'lecture' },
          { time: '15:00-16:00', subject: 'Software Engineering', room: 'B103', instructor: 'Dr. Taylor', type: 'tutorial' }
        ]
      },
      {
        studentId: 'STU002',
        day: 'Monday',
        slots: [
          { time: '09:00-10:00', subject: 'Programming Fundamentals', room: 'C101', instructor: 'Ms. Anderson', type: 'lecture' },
          { time: '11:00-12:00', subject: 'Mathematics', room: 'C102', instructor: 'Dr. White', type: 'lecture' },
          { time: '14:00-15:00', subject: 'Digital Logic', room: 'C103', instructor: 'Prof. Garcia', type: 'lab' }
        ]
      }
    ];

    await Timetable.insertMany(timetable);

    // Create dummy tests
    const tests = [
      {
        studentId: 'STU001',
        subject: 'Data Structures',
        title: 'Midterm Examination',
        date: '2024-02-15',
        time: '10:00',
        duration: 120,
        type: 'midterm',
        room: 'Exam Hall A',
        totalMarks: 100,
        instructions: 'Bring calculator and ID card'
      },
      {
        studentId: 'STU001',
        subject: 'Algorithms',
        title: 'Weekly Quiz',
        date: '2024-02-20',
        time: '14:00',
        duration: 90,
        type: 'quiz',
        room: 'A102',
        totalMarks: 50
      },
      {
        studentId: 'STU002',
        subject: 'Programming Fundamentals',
        title: 'Final Project Presentation',
        date: '2024-02-18',
        time: '09:00',
        duration: 150,
        type: 'project',
        room: 'C101',
        totalMarks: 100,
        instructions: 'Prepare 10-minute presentation'
      }
    ];

    await Tests.insertMany(tests);

    console.log('Dummy data initialized successfully');
  } catch (error) {
    console.error('Error initializing dummy data:', error);
  }
};

async function bootstrap() {
  await client.connect();
  // Derive DB name from URI path or DB_NAME env, fallback to 'sih_attendance'
  let dbNameFromUri = null;
  try {
    const u = new URL(MONGODB_URI);
    dbNameFromUri = (u.pathname || '').replace(/^\//, '') || null;
  } catch (_) {
    // ignore URL parse errors
  }
  const dbName = process.env.DB_NAME || dbNameFromUri || 'sih_attendance';
  db = client.db(dbName);

  // Connection diagnostics
  try {
    await db.command({ ping: 1 });
    console.log(`MongoDB Connected. DB: ${db.databaseName}`);
  } catch (e) {
    console.warn('MongoDB ping failed:', e?.message || e);
  }
  Students = db.collection('students');
  Attendance = db.collection('attendance');
  Timetable = db.collection('timetables');
  Tests = db.collection('tests');
  QRTokens = db.collection('qr_tokens');

  await initializeIndexes();
  await initializeDummyData();
}

// Routes

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    // Dummy authentication - in real app, verify credentials
    const student = await Students.findOne({ studentId });
    
    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      success: true,
      student: {
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        department: student.department,
        year: student.year
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate QR token for attendance
app.post('/api/attendance/generate-qr', async (req, res) => {
  try {
    // Clear expired tokens
    await QRTokens.deleteMany({ expiresAt: { $lt: new Date() } });
    
    // Generate new token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60 seconds
    
    await QRTokens.insertOne({ token, expiresAt, createdAt: new Date() });
    
    res.json({
      success: true,
      token,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark attendance
app.post('/api/attendance/mark', async (req, res) => {
  try {
    const { token, deviceId, studentId } = req.body;
    
    // Validate QR token
    const qrToken = await QRTokens.findOne({ token, expiresAt: { $gt: new Date() } });
    
    if (!qrToken) {
      return res.status(400).json({ error: 'Invalid or expired QR token' });
    }
    
    // Check if student already marked attendance for this session
    const existingAttendance = await Attendance.findOne({
      studentId,
      deviceId,
      date: moment().format('YYYY-MM-DD'),
      sessionToken: token
    });
    
    if (existingAttendance) {
      return res.status(400).json({ error: 'Attendance already marked for this session' });
    }
    
    // Create attendance record
    await Attendance.insertOne({
      studentId,
      deviceId,
      date: moment().format('YYYY-MM-DD'),
      time: moment().format('HH:mm:ss'),
      sessionToken: token,
      status: 'present',
      createdAt: new Date(),
    });
    
    // Remove used token
    await QRTokens.deleteOne({ token });
    
    res.json({
      success: true,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Attendance already marked for this session' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Get attendance records and percentage
app.get('/api/attendance/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const attendanceRecords = await Attendance.find({ studentId }).toArray();
    
    // Calculate percentage
    const totalDays = 30; // Assuming 30 days in current month
    const presentDays = attendanceRecords.length;
    const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    
    res.json({
      success: true,
      records: attendanceRecords,
      percentage: Math.round(percentage * 100) / 100,
      totalDays,
      presentDays
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get timetable
app.get('/api/timetable/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const timetable = await Timetable.find({ studentId }).toArray();
    
    res.json({
      success: true,
      timetable
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get free time slots
app.get('/api/freetime/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const currentTime = moment();
    const currentDay = currentTime.format('dddd');
    const currentTimeStr = currentTime.format('HH:mm');
    
    // Get today's timetable
    const todayTimetable = await Timetable.findOne({ studentId, day: currentDay });
    
    if (!todayTimetable) {
      return res.json({
        success: true,
        isFree: true,
        message: 'No classes scheduled for today',
        suggestedActivities: [
          'Study for upcoming exams',
          'Work on assignments',
          'Review previous lectures',
          'Practice coding problems'
        ]
      });
    }
    
    // Check if current time falls within any class
    let isFree = true;
    let nextClass = null;
    
    for (const slot of todayTimetable.slots) {
      const [startTime, endTime] = slot.time.split('-');
      if (currentTimeStr >= startTime && currentTimeStr <= endTime) {
        isFree = false;
        break;
      }
      if (currentTimeStr < startTime && !nextClass) {
        nextClass = slot;
      }
    }
    
    const suggestedActivities = [
      'Study for upcoming exams',
      'Work on assignments',
      'Review previous lectures',
      'Practice coding problems',
      'Take a break and relax',
      'Work on personal projects'
    ];
    
    res.json({
      success: true,
      isFree,
      nextClass,
      suggestedActivities
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get tests/exams
app.get('/api/tests/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const tests = await Tests.find({ studentId }).toArray();
    
    res.json({
      success: true,
      tests
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: list attendance records with optional filters
// GET /api/attendance?studentId=STU001&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&limit=200
app.get('/api/attendance', async (req, res) => {
  try {
    const { studentId, dateFrom, dateTo } = req.query;
    let limit = parseInt(req.query.limit || '200', 10);
    if (Number.isNaN(limit) || limit <= 0 || limit > 1000) limit = 200;

    const query = {};
    if (studentId) query.studentId = studentId;
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = dateFrom;
      if (dateTo) query.date.$lte = dateTo;
    }

    const records = await Attendance.find(query)
      .sort({ date: -1, time: -1 })
      .limit(limit)
      .toArray();

    // Attach student names
    const ids = [...new Set(records.map(r => r.studentId).filter(Boolean))];
    const students = ids.length ? await Students.find({ studentId: { $in: ids } }).toArray() : [];
    const nameMap = new Map(students.map(s => [s.studentId, s.name]));
    const withNames = records.map(r => ({ ...r, studentName: nameMap.get(r.studentId) || null }));

    res.json({ success: true, attendance: withNames });
  } catch (error) {
    console.error('Attendance list error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// AI routes
app.get('/ai', (req, res) => {
  res.send('AI Online');
});

app.post('/ai', async (req, res) => {
  try {
    const { query, role } = (req.body || {});
    if (!query) return res.json({ ans: 'Welcome Learner!!!' });

    const ai = await getAIClient();
    const prompt = buildPrompt(query, role);
    const modelName = process.env.AI_MODEL || 'gemini-2.5-flash';

    let text = '';
    let ok = false;
    try {
      // Primary call style used in root index.js
      const response = await ai.models.generateContent({ model: modelName, contents: prompt });
      if (typeof response?.text === 'string') {
        text = response.text;
        ok = true;
      } else if (response?.response?.text) {
        try { text = response.response.text(); ok = true; } catch (_) {}
      }
    } catch (e1) {
      console.warn('[AI] primary call failed:', e1?.message || e1);
      try {
        // Fallback for alternate client surface
        const model = ai.getGenerativeModel ? ai.getGenerativeModel({ model: modelName }) : null;
        if (model) {
          const r = await model.generateContent(prompt);
          if (r?.response?.text) {
            text = r.response.text();
            ok = true;
          }
        }
      } catch (e2) {
        console.error('[AI] fallback call failed:', e2?.message || e2);
      }
    }

    if (!ok) {
      console.error('[AI] No text produced. Check API_KEY and model permissions.');
      return res.status(500).json({ error: 'AI not available. Check API key/model on server.' });
    }

    if (!text) text = 'Sorry, no response.';
    return res.json({ ans: text });
  } catch (err) {
    console.error('AI route error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

// Start server
bootstrap()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
