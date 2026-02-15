import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import healthRouter from './routes/health';
import citizensRouter from './routes/citizens';
import adminAuthRouter from './routes/admin-auth';
import adminStatsRouter from './routes/admin-stats';
import adminResponsesRouter from './routes/admin-responses';
import adminDemographicsRouter from './routes/admin-demographics';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// API routes
app.use(healthRouter);
app.use(citizensRouter);
app.use(adminAuthRouter);
app.use(adminStatsRouter);
app.use(adminResponsesRouter);
app.use(adminDemographicsRouter);

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
