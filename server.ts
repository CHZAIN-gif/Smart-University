import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import Database from "better-sqlite3";
import path from "path";
import { Notice, NoticeInput, ServerEvent, ClientEvent } from "./src/types";

const db = new Database("notices.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    author TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME
  )
`);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());

  // WebSocket logic
  const broadcast = (event: ServerEvent) => {
    const data = JSON.stringify(event);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };

  wss.on("connection", (ws) => {
    console.log("Client connected");
    
    // Send initial state
    const notices = db.prepare("SELECT * FROM notices ORDER BY createdAt DESC").all() as any[];
    const formattedNotices: Notice[] = notices.map(n => ({
      ...n,
      createdAt: n.createdAt
    }));
    
    ws.send(JSON.stringify({ type: 'INITIAL_STATE', notices: formattedNotices }));

    ws.on("message", (data) => {
      try {
        const event = JSON.parse(data.toString()) as ClientEvent;
        
        if (event.type === 'ADD_NOTICE') {
          const { title, content, category, priority, author, expiresAt } = event.notice;
          const info = db.prepare(`
            INSERT INTO notices (title, content, category, priority, author, expiresAt)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(title, content, category, priority, author, expiresAt || null);
          
          const newNotice: Notice = {
            id: info.lastInsertRowid as number,
            title,
            content,
            category,
            priority,
            author,
            expiresAt,
            createdAt: new Date().toISOString()
          };
          
          broadcast({ type: 'NOTICE_ADDED', notice: newNotice });
        } else if (event.type === 'DELETE_NOTICE') {
          db.prepare("DELETE FROM notices WHERE id = ?").run(event.id);
          broadcast({ type: 'NOTICE_DELETED', id: event.id });
        }
      } catch (err) {
        console.error("WS Message Error:", err);
      }
    });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
