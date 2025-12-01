import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import websiteRouter from './routes/WebsiteRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Web Health Check API',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/websites', websiteRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
});

export default app;

