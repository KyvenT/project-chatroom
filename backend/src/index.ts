import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import env from './env.js';

const app = express();
const SERVER_PORT = env.SERVER_PORT;

// get file path from URL of current module
const __filename = fileURLToPath(import.meta.url);
// get directory name from the file path
const __dirname = dirname(__filename);
const pathToStaticFiles = path.join(__dirname, '../../frontend/dist');

// middleware
app.use(express.json());

// setting up path for static files
app.use(express.static(pathToStaticFiles));

// initial send of index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(pathToStaticFiles, 'index.html'));
})

// routes
app.use('/',);

// start server
app.listen(SERVER_PORT, () => {
  console.log(`Server running on http://localhost:${SERVER_PORT}`);
}); 