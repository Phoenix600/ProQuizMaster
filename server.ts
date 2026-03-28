import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('quiz.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student'
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    courseName TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    courseId TEXT NOT NULL,
    chapterName TEXT NOT NULL,
    description TEXT,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    chapterId TEXT NOT NULL,
    quizTitle TEXT NOT NULL,
    description TEXT,
    passingScore INTEGER NOT NULL,
    timeLimit INTEGER NOT NULL,
    isPublished INTEGER DEFAULT 0,
    FOREIGN KEY (chapterId) REFERENCES chapters(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    quizId TEXT NOT NULL,
    questionText TEXT NOT NULL,
    codeSnippet TEXT,
    options TEXT NOT NULL,
    numberOfCorrectAnswers INTEGER NOT NULL,
    explanation TEXT,
    "order" INTEGER NOT NULL,
    FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS results (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    quizId TEXT NOT NULL,
    score INTEGER NOT NULL,
    totalQuestions INTEGER NOT NULL,
    percentage REAL NOT NULL,
    isPassed INTEGER NOT NULL,
    timeTaken INTEGER NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE
  );

  -- Add default admin if not exists
  INSERT OR IGNORE INTO users (id, name, email, password, role) 
  VALUES ('admin-id', 'Admin', 'pranayramteke613@gmail.com', 'admin123', 'admin');
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(id, name, email, password, 'student');
      res.json({ user: { _id: id, name, email, role: 'student' }, token: 'fake-jwt-token' });
    } catch (err) {
      res.status(400).json({ message: 'Email already exists' });
    }
  });

  app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
    if (user) {
      res.json({ user: { _id: user.id, name: user.name, email: user.email, role: user.role }, token: 'fake-jwt-token' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });

  // Course Routes
  app.get('/api/courses', (req, res) => {
    const courses = db.prepare('SELECT id as _id, courseName, description FROM courses').all();
    res.json(courses);
  });

  app.post('/api/courses', (req, res) => {
    const { courseName, description } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare('INSERT INTO courses (id, courseName, description) VALUES (?, ?, ?)').run(id, courseName, description);
    res.json({ _id: id, courseName, description });
  });

  app.put('/api/courses/:id', (req, res) => {
    const { courseName, description } = req.body;
    db.prepare('UPDATE courses SET courseName = ?, description = ? WHERE id = ?').run(courseName, description, req.params.id);
    res.json({ _id: req.params.id, courseName, description });
  });

  app.delete('/api/courses/:id', (req, res) => {
    db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Chapter Routes
  app.get('/api/chapters', (req, res) => {
    const { courseId } = req.query;
    const chapters = db.prepare('SELECT id as _id, courseId, chapterName, description FROM chapters WHERE courseId = ?').all(courseId);
    res.json(chapters);
  });

  app.post('/api/chapters', (req, res) => {
    const { courseId, chapterName, description } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare('INSERT INTO chapters (id, courseId, chapterName, description) VALUES (?, ?, ?, ?)').run(id, courseId, chapterName, description);
    res.json({ _id: id, courseId, chapterName, description });
  });

  app.put('/api/chapters/:id', (req, res) => {
    const { chapterName, description } = req.body;
    db.prepare('UPDATE chapters SET chapterName = ?, description = ? WHERE id = ?').run(chapterName, description, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/chapters/:id', (req, res) => {
    db.prepare('DELETE FROM chapters WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Quiz Routes
  app.get('/api/quizzes', (req, res) => {
    const { chapterId } = req.query;
    const quizzes = db.prepare('SELECT id as _id, chapterId, quizTitle, description, passingScore, timeLimit, isPublished FROM quizzes WHERE chapterId = ?').all(chapterId);
    res.json(quizzes.map(q => ({ ...q, isPublished: !!q.isPublished })));
  });

  app.post('/api/quizzes', (req, res) => {
    const { chapterId, quizTitle, description, passingScore, timeLimit } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare('INSERT INTO quizzes (id, chapterId, quizTitle, description, passingScore, timeLimit, isPublished) VALUES (?, ?, ?, ?, ?, ?, 0)').run(id, chapterId, quizTitle, description, passingScore, timeLimit);
    res.json({ _id: id, chapterId, quizTitle, description, passingScore, timeLimit, isPublished: false });
  });

  app.put('/api/quizzes/:id', (req, res) => {
    const { quizTitle, description, passingScore, timeLimit, isPublished } = req.body;
    if (isPublished !== undefined) {
      db.prepare('UPDATE quizzes SET isPublished = ? WHERE id = ?').run(isPublished ? 1 : 0, req.params.id);
    } else {
      db.prepare('UPDATE quizzes SET quizTitle = ?, description = ?, passingScore = ?, timeLimit = ? WHERE id = ?').run(quizTitle, description, passingScore, timeLimit, req.params.id);
    }
    res.json({ success: true });
  });

  app.delete('/api/quizzes/:id', (req, res) => {
    db.prepare('DELETE FROM quizzes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Question Routes
  app.get('/api/questions', (req, res) => {
    const { quizId } = req.query;
    const questions = db.prepare('SELECT id as _id, quizId, questionText, codeSnippet, options, numberOfCorrectAnswers, explanation, "order" FROM questions WHERE quizId = ? ORDER BY "order"').all(quizId);
    res.json(questions.map(q => ({ ...q, options: JSON.parse(q.options) })));
  });

  app.post('/api/questions', (req, res) => {
    const { quizId, questionText, codeSnippet, options, numberOfCorrectAnswers, explanation, order } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare('INSERT INTO questions (id, quizId, questionText, codeSnippet, options, numberOfCorrectAnswers, explanation, "order") VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, quizId, questionText, codeSnippet, JSON.stringify(options), numberOfCorrectAnswers, explanation, order);
    res.json({ _id: id, quizId, questionText, codeSnippet, options, numberOfCorrectAnswers, explanation, order });
  });

  app.put('/api/questions/:id', (req, res) => {
    const { questionText, codeSnippet, options, numberOfCorrectAnswers, explanation, order } = req.body;
    db.prepare('UPDATE questions SET questionText = ?, codeSnippet = ?, options = ?, numberOfCorrectAnswers = ?, explanation = ?, "order" = ? WHERE id = ?').run(questionText, codeSnippet, JSON.stringify(options), numberOfCorrectAnswers, explanation, order, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/questions/:id', (req, res) => {
    db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Result Routes
  app.post('/api/results', (req, res) => {
    const { userId, quizId, score, totalQuestions, percentage, isPassed, timeTaken } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare('INSERT INTO results (id, userId, quizId, score, totalQuestions, percentage, isPassed, timeTaken) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, userId, quizId, score, totalQuestions, percentage, isPassed ? 1 : 0, timeTaken);
    res.json({ _id: id, userId, quizId, score, totalQuestions, percentage, isPassed, timeTaken, createdAt: new Date().toISOString() });
  });

  app.get('/api/results/me', (req, res) => {
    const { userId } = req.query;
    const results = db.prepare('SELECT id as _id, userId, quizId, score, totalQuestions, percentage, isPassed, timeTaken, createdAt FROM results WHERE userId = ? ORDER BY createdAt DESC').all(userId);
    res.json(results.map(r => ({ ...r, isPassed: !!r.isPassed })));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
