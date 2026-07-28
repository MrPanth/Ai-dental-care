require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const User = require('./models/User');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

// Dynamic localhost CORS handler
const localCorsOptions = {
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

const io = socketIo(server, {
  cors: {
    ...localCorsOptions,
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet({ contentSecurityPolicy: false })); // Basic headers
app.use(cors(localCorsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again later" }
});
app.use('/api/', limiter);

// Static files (Uploads only)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/doctor', require('./routes/doctorRoutes'));
app.use('/api/patient', require('./routes/patientRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));

// Health check endpoint for API server
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "AI Dental Care API Server Running"
  });
});

// Seed admin account
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@dentalcare.com',
        password: 'Admin@123',
        role: 'admin',
        city: 'all'
      });
      console.log('Admin account seeded: admin@dentalcare.com / Admin@123');
    }
  } catch (error) {
    console.error('Seed admin error:', error.message);
  }
};

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their notification room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to our routes
app.set('socketio', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await seedAdmin();
});

app.server = server;
module.exports = app;

