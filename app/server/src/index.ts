import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { vehiclesRouter } from './routes/vehicles';
import { listingsRouter } from './routes/listings';

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
const host = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json());

// Multer in-memory storage (for demo). In production you may want disk or S3.
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { files: 20, fileSize: 10 * 1024 * 1024 } });

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Mount new API routers
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/listings', listingsRouter);

// TODO: Remove legacy endpoint once frontend updated
app.post('/api/generate', upload.array('images', 20), async (_req, res) => {
  res.status(410).json({ ok: false, error: 'Deprecated. Use /api/listings/generate' });
});

app.listen(port, host, () => {
  const local = `http://localhost:${port}`;
  // Try to compute LAN address
  let lan: string | null = null;
  try {
    const os = require('os');
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          lan = `http://${net.address}:${port}`;
          break;
        }
      }
      if (lan) break;
    }
  } catch {}
  console.log('Server listening:');
  console.log(`  Local:   ${local}`);
  if (lan) console.log(`  Network: ${lan}`);
});
