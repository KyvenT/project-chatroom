import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import env from './env.js';
import apiRouter from './routes/routes.js';
import { WebSocketServer } from 'ws';
import http from 'http';
import { authRouter } from './routes/auth/auth.js';

const app = express();

// get file path from URL of current module
const __filename = fileURLToPath(import.meta.url);
// get directory name from the file path
const __dirname = dirname(__filename);
const pathToStaticFiles = path.join(__dirname, '../../frontend/dist');

// setting up path for static files
app.use(express.static(pathToStaticFiles));

// middleware
app.use(express.json());

// routes
app.use('/api', apiRouter);

// initial send of index.html
app.get('/', (req, res) => {
  console.log('Serving index.html');
  res.sendFile(path.join(pathToStaticFiles, 'index.html'));
})

const server = app.listen(env.SERVER_PORT, () => {
  console.log(`Express server running on http://localhost:${env.SERVER_PORT}`)
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
