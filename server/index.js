import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();
const port = Number(process.env.PORT) || 3001;
const isProduction = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: isProduction ? false : true,
    methods: ['GET'],
  }),
);
app.use(express.json({ limit: '10kb' }));
app.use(morgan(isProduction ? 'combined' : 'dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'sanal-buket-api',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/message', (req, res) => {
  res.status(200).json({
    title: 'İyi ki Doğdunuz Ayşe Latife Hocam',
    body: 'Bazı çiçekler toprakta, bazıları kalplerde büyür. 6 yıllık geleneğimizin bu seneki fidesi dijital dünyada, ama kökleri her zamanki gibi kalbimde. Sizi çok seviyorum, iyi ki varsınız...',
    signature: '- Yusuf Sait',
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl,
  });
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
