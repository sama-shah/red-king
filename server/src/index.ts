import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { RoomManager } from './rooms/RoomManager.js';
import { createSocketServer } from './socket/index.js';

const PORT = process.env.PORT || 3001;
const CLIENT_URLS = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(u => u.trim());

const app = express();
app.use(cors({ origin: CLIENT_URLS }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const httpServer = createServer(app);
const roomManager = new RoomManager();
createSocketServer(httpServer, roomManager);

httpServer.listen(PORT, () => {
  console.log(`Red King server running on port ${PORT}`);
});
