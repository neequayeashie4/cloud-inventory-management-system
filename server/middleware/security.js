const helmet = require('helmet');
const cors = require('cors');

// Allowed Origins Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', // Vite Default Port
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy Restriction: Request Origin Not Allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

const configureSecurity = (app) => {
  // Set Security-focused HTTP Headers
  app.use(helmet());

  // Enable Cross-Origin Resource Sharing
  app.use(cors(corsOptions));
};

module.exports = configureSecurity;