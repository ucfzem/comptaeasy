import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));
app.get('*', (req, res) => res.json({ error: 'not found' }));

export default app;
