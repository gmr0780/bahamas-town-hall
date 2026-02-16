import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import healthRouter from './routes/health';
import citizensRouter from './routes/citizens';
import adminAuthRouter from './routes/admin-auth';
import adminStatsRouter from './routes/admin-stats';
import adminResponsesRouter from './routes/admin-responses';
import adminDemographicsRouter from './routes/admin-demographics';
import adminInsightsRouter from './routes/admin-insights';
import adminExportRouter from './routes/admin-export';
import adminManagementRouter from './routes/admin-management';
import questionsRouter from './routes/questions';
import adminQuestionsRouter from './routes/admin-questions';
import siteSettingsRouter from './routes/site-settings';
import publicResultsRouter from './routes/public-results';
import chatRouter from './routes/chat';

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? corsOrigin : true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { errors: ['Too many submissions, please try again later'] },
  standardHeaders: true,
  legacyHeaders: false,
});

// API routes
app.use(healthRouter);
app.use(siteSettingsRouter);
app.use(chatRouter);
app.use(publicResultsRouter);
app.use(questionsRouter);
app.use('/api/citizens', submissionLimiter);
app.use(citizensRouter);
app.use('/api/admin/login', loginLimiter);
app.use(adminAuthRouter);
app.use(adminQuestionsRouter);
app.use(adminStatsRouter);
app.use(adminResponsesRouter);
app.use(adminDemographicsRouter);
app.use(adminInsightsRouter);
app.use(adminExportRouter);
app.use(adminManagementRouter);

// Production: serve client build
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
