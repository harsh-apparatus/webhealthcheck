import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();


// CORS configuration - allow all origins (will be secured later)
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



app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString(),
    data: {
      path: req.originalUrl
    }
  });
});

export default app;

