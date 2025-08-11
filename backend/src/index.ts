import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import env from './env.js';
import apiRouter from './routes/routes.js';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { corsPreflightMiddleware } from './middleware/corsPreflightMiddleware.js';
import jwt from "jsonwebtoken";
import { userSocketMap, guestSocketMap } from './lib/socketMaps.js';
import { startWSS } from './wss/wss.js';

const corsOptions = {
  origin: ['http://127.0.0.1:5173'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}

const app = express();

app.use(cors(corsOptions));

// get file path from URL of current module
const __filename = fileURLToPath(import.meta.url);
// get directory name from the file path
const __dirname = dirname(__filename);
const pathToStaticFiles = path.join(__dirname, '../../frontend/dist');

// setting up path for static files
app.use(express.static(pathToStaticFiles));

// middleware
app.use(express.json());
app.use(corsPreflightMiddleware);

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

startWSS(server);