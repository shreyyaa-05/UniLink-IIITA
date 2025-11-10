const express = require('express');

const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const connectDB = require('./config/db'); 
const path = require('path');
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
// Add this line in server.js
app.use('/api/lnf', require('./routes/lnfRoutes'));
const vehicleRoutes = require('./routes/vehicleRoutes');
app.use('/api/rides', require('./routes/rideRoutes'));

app.use('/api/vehicles', vehicleRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/blood-requests', require('./routes/bloodRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT} 🔥`);
  console.log(`View your website at: http://localhost:${PORT}`); 
});