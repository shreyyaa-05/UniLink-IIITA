const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const connectDB = require('./config/db'); 
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const chatRoutes = require('./routes/chatRoutes');
const { protect } = require('./middleware/authMiddleware');
const bloodRoutes = require('./routes/bloodRoutes');

connectDB(); 

const app = express();
app.use(cors());

app.use(express.json()); 
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'main.html'));
});
app.get('/commute-pooling', protect, (req, res) => { res.sendFile(path.join(__dirname, 'public', 'cp.html')); });
app.get('/profile', protect, (req, res) => { res.sendFile(path.join(__dirname, 'public', 'profile.html')); });
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes')); 
app.use('/api/lnf', require('./routes/lnfRoutes'));
const vehicleRoutes = require('./routes/vehicleRoutes');
app.use('/api/rides', require('./routes/rideRoutes'));

app.use('/api/vehicles', vehicleRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/blood-requests', require('./routes/bloodRoutes'));

// Wrap Express with HTTP Server for Socket.IO support
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Expose Socket.IO globally for controller access
global.io = io;

io.on('connection', (socket) => {
  console.log('Client connected to Socket.IO notification channel');

  socket.on('join', (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`User ${userId} joined notification channel`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected from notification channel');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT} 🔥`);
  console.log(`View your website at: http://localhost:${PORT}`); 
});