// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { createServer } = require('http'); // For Socket.IO
const { Server } = require('socket.io'); // For Socket.IO

const corsMiddleware = require('./config/cors');

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const friendRoutes = require('./routes/friendRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const { socketHandler, getSocketId } = require('./socketManager'); // Import getSocketId if needed globally, though usually socketHandler is enough here

dotenv.config();

const app = express();
const httpServer = createServer(app); // Create HTTP server from Express app

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "https://frontend-social-media-hsstw3es4-gurusewak-singhs-projects.vercel.app/", // Your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }
});

// IMPORTANT: Make io accessible to your routes/controllers
app.set('socketio', io);

// Initialize your custom socket event handlers
socketHandler(io);

// --- Middleware ---
app.use(corsMiddleware); // Your custom CORS configuration
app.use(express.json()); // To parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded request bodies

// --- API Routes ---
// Prefixing routes makes them cleaner
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/friend', friendRoutes);
app.use('/api/notifications', notificationRoutes);

// A simple root route
app.get('/api', (req, res) => {
  res.send('Social Media API is running 🚀');
});

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection failed:", err.message)); // Added colon for clarity

// --- Socket.IO base connection listener (optional, as socketHandler handles specific logic) ---
// This is often included in socketManager.js itself, but can be here for a general connection log
io.on('connection', (socket) => {
  console.log('A user connected via main server listener:', socket.id); // Differentiate from socketManager's log if any

  // Example: Send a welcome message to the connected client
  socket.emit('welcome', 'Welcome to the Social Media Platform!');

  socket.on('disconnect', () => {
    console.log('User disconnected via main server listener:', socket.id);
  });
});

// --- Server Listening ---
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => { // Use httpServer to listen, not app
  console.log(`Server is running on port ${PORT}`);
});
