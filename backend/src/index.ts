import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import feedbackRoutes from './routes/feedback.routes';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', authRoutes);

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'FeedPulse API is running' });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', message: 'The requested endpoint does not exist' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error', message: err.message });
});

// Only start the server if this file is run directly (not imported by tests)
if (require.main === module) {
  connectDB().then(() => {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 FeedPulse API running on http://localhost:${PORT}`);
    });
  }).catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
}

export default app;