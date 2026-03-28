import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("quiz.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL DEFAULT 'General',
    chapter TEXT NOT NULL DEFAULT 'General',
    topic TEXT NOT NULL DEFAULT 'General',
    question TEXT NOT NULL,
    code TEXT,
    option1 TEXT NOT NULL,
    option2 TEXT NOT NULL,
    option3 TEXT NOT NULL,
    option4 TEXT NOT NULL,
    correct_option INTEGER NOT NULL,
    image TEXT
  )
`);

// Check if topic column exists (migration for existing db)
try {
  db.prepare("SELECT topic FROM questions LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE questions ADD COLUMN topic TEXT NOT NULL DEFAULT 'General'");
}

// Check if image column exists
try {
  db.prepare("SELECT image FROM questions LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE questions ADD COLUMN image TEXT");
}

// Seed data if empty
const count = db.prepare("SELECT COUNT(*) as count FROM questions").get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare(`
    INSERT INTO questions (subject, chapter, topic, question, code, option1, option2, option3, option4, correct_option, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Java
  insert.run("Java", "Basics", "Data Types", "Which of these is not a primitive data type in Java?", null, "int", "boolean", "String", "char", 3, null);
  insert.run("Java", "Basics", "Data Types", "What is the size of 'int' in Java?", null, "16 bits", "32 bits", "64 bits", "8 bits", 2, null);
  insert.run("Java", "Basics", "Variables", "What is the default value of a boolean variable in Java?", null, "true", "false", "0", "null", 2, null);
  
  insert.run("Java", "OOP", "Inheritance", "What is inheritance in Java?", "class B extends A { }", "Creating a new class from an existing one", "Hiding data", "Multiple methods with same name", "None of the above", 1, "https://picsum.photos/seed/inheritance/800/400");
  insert.run("Java", "OOP", "Classes", "Which keyword is used to prevent a class from being inherited?", "____ class FinalClass { }", "static", "final", "abstract", "private", 2, null);
  insert.run("Java", "OOP", "Polymorphism", "What is polymorphism in Java?", "Animal a = new Dog();\na.makeSound();", "Many forms", "Data hiding", "Code reuse", "None of the above", 1, null);
  
  insert.run("Java", "Collections", "Interfaces", "Which interface is the root of the collection hierarchy?", null, "List", "Set", "Collection", "Map", 3, null);
  insert.run("Java", "Collections", "Lists", "Which collection allows duplicate elements?", "List<String> list = new ArrayList<>();", "Set", "List", "Map", "None of the above", 2, null);
  
  // JavaScript
  insert.run("JS", "Basics", "Types", "What is the output of 'typeof null'?", "console.log(typeof null);", "null", "undefined", "object", "string", 3, null);
  insert.run("JS", "Basics", "Variables", "Which keyword is used to declare a block-scoped variable?", "____ x = 10;", "var", "let", "global", "none", 2, null);
  insert.run("JS", "Async", "Promises", "Which keyword is used to wait for a Promise?", "async function test() { ____ promise; }", "wait", "await", "then", "hold", 2, "https://picsum.photos/seed/promises/800/400");
  
  // React
  insert.run("React", "Hooks", "State", "Which hook is used for side effects?", "useEffect(() => { ... }, [])", "useState", "useContext", "useEffect", "useMemo", 3, null);
  insert.run("React", "Components", "Props", "How do you pass data to a child component?", "<Child ____={data} />", "state", "props", "data", "value", 2, "https://picsum.photos/seed/react/800/400");
  
  // Spring Boot
  insert.run("Spring Boot", "Annotations", "REST", "Which annotation is used to mark a class as a REST controller?", "@RestController\npublic class MyController { }", "@Controller", "@Service", "@Repository", "@RestController", 4, null);
  insert.run("Spring Boot", "Basics", "Config", "Which file is used for configuration in Spring Boot?", null, "pom.xml", "application.properties", "web.xml", "index.html", 2, null);

  // MySQL
  insert.run("MySQL", "Basics", "Intro", "What does SQL stand for?", null, "Structured Query Language", "Structured Question Language", "Strong Query Language", "Simple Query Language", 1, null);
  insert.run("MySQL", "Queries", "SELECT", "Which keyword is used to fetch unique values?", "SELECT ____ name FROM users;", "DISTINCT", "UNIQUE", "DIFFERENT", "SINGLE", 1, null);
  insert.run("MySQL", "Queries", "Joins", "Which join returns all records from the left table?", "SELECT * FROM A ____ JOIN B ON A.id = B.id;", "INNER", "LEFT", "RIGHT", "OUTER", 2, "https://picsum.photos/seed/sql/800/400");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get("/api/subjects", (req, res) => {
    const subjects = db.prepare("SELECT DISTINCT subject FROM questions").all();
    res.json(subjects.map((s: any) => s.subject));
  });

  app.get("/api/chapters", (req, res) => {
    const { subject } = req.query;
    if (!subject) return res.status(400).json({ error: "Subject is required" });
    const chapters = db.prepare("SELECT DISTINCT chapter FROM questions WHERE subject = ?").all(subject);
    res.json(chapters.map((c: any) => c.chapter));
  });

  app.get("/api/topics", (req, res) => {
    const { subject, chapter } = req.query;
    if (!subject || !chapter) return res.status(400).json({ error: "Subject and chapter are required" });
    const topics = db.prepare("SELECT DISTINCT topic FROM questions WHERE subject = ? AND chapter = ?").all(subject, chapter);
    const result = topics.map((t: any) => {
      const count = db.prepare("SELECT COUNT(*) as count FROM questions WHERE subject = ? AND chapter = ? AND topic = ?").get(subject, chapter, t.topic) as { count: number };
      return {
        name: t.topic,
        questionCount: count.count
      };
    });
    res.json(result);
  });

  app.get("/api/hierarchy", (req, res) => {
    const subjects = db.prepare("SELECT DISTINCT subject FROM questions").all();
    const result = subjects.map((s: any) => {
      const chapters = db.prepare("SELECT DISTINCT chapter FROM questions WHERE subject = ?").all(s.subject);
      return {
        name: s.subject,
        chapters: chapters.map((c: any) => {
          const topics = db.prepare("SELECT DISTINCT topic FROM questions WHERE subject = ? AND chapter = ?").all(s.subject, c.chapter);
          return {
            name: c.chapter,
            topics: topics.map((t: any) => t.topic)
          };
        })
      };
    });
    res.json(result);
  });

  app.get("/api/questions", (req, res) => {
    const { subject, chapter, topic } = req.query;
    let questions;
    if (subject && chapter && topic) {
      questions = db.prepare("SELECT * FROM questions WHERE subject = ? AND chapter = ? AND topic = ?").all(subject, chapter, topic);
    } else if (subject && chapter) {
      questions = db.prepare("SELECT * FROM questions WHERE subject = ? AND chapter = ?").all(subject, chapter);
    } else if (subject) {
      questions = db.prepare("SELECT * FROM questions WHERE subject = ?").all(subject);
    } else {
      questions = db.prepare("SELECT * FROM questions").all();
    }
    res.json(questions);
  });

  app.post("/api/questions", (req, res) => {
    const { subject, chapter, topic, question, code, option1, option2, option3, option4, correct_option, image } = req.body;
    const info = db.prepare(`
      INSERT INTO questions (subject, chapter, topic, question, code, option1, option2, option3, option4, correct_option, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(subject || 'General', chapter || 'General', topic || 'General', question, code, option1, option2, option3, option4, correct_option, image);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/questions/:id", (req, res) => {
    db.prepare("DELETE FROM questions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.put("/api/questions/:id", (req, res) => {
    const { subject, chapter, topic, question, code, option1, option2, option3, option4, correct_option, image } = req.body;
    db.prepare(`
      UPDATE questions 
      SET subject = ?, chapter = ?, topic = ?, question = ?, code = ?, option1 = ?, option2 = ?, option3 = ?, option4 = ?, correct_option = ?, image = ?
      WHERE id = ?
    `).run(subject, chapter, topic, question, code, option1, option2, option3, option4, correct_option, image, req.params.id);
    res.json({ success: true });
  });

  app.put("/api/subjects/rename", (req, res) => {
    const { oldName, newName } = req.body;
    db.prepare("UPDATE questions SET subject = ? WHERE subject = ?").run(newName, oldName);
    res.json({ success: true });
  });

  app.put("/api/chapters/rename", (req, res) => {
    const { subject, oldName, newName } = req.body;
    db.prepare("UPDATE questions SET chapter = ? WHERE subject = ? AND chapter = ?").run(newName, subject, oldName);
    res.json({ success: true });
  });

  app.put("/api/topics/rename", (req, res) => {
    const { subject, chapter, oldName, newName } = req.body;
    db.prepare("UPDATE questions SET topic = ? WHERE subject = ? AND chapter = ? AND topic = ?").run(newName, subject, chapter, oldName);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
