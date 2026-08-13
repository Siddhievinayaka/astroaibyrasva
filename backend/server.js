import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import adminRoutes from './routes/admin.js';
import chatRoutes from './routes/chats.js';
import ChatMessage from './models/ChatMessage.js';
import { sendWhatsAppVisitNotification } from './utils/whatsapp.js';

import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rameigreenastroai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Routes - reloaded with LotusRain SMTP brand
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chats', chatRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Serve static frontend files from client build directory in production
app.use(express.static(path.join(__dirname, '../client/build')));

// Fallback all non-API GET requests to client build index.html
app.get('*', (req, res, next) => {
  // Don't intercept API endpoints
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // Don't intercept socket.io requests - let socket.io handle them
  if (req.path.startsWith('/socket.io')) {
    return next();
  }
  
  // If request looks like a file (contains a dot, e.g. script.js, style.css),
  // return a 404 instead of falling back to index.html to prevent white screen error
  if (req.path.includes('.')) {
    return res.status(404).send('Not Found');
  }

  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Create HTTP Server & Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Track sessions visited to prevent spamming WhatsApp alerts on refresh
const activeVisits = new Set();

io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // Join a room based on session ID
  socket.on('join_session', ({ sessionId, isAdmin }) => {
    socket.join(sessionId);
    if (isAdmin) {
      socket.join('admins');
      console.log(`Admin joined socket room: admins and session room: ${sessionId}`);
    } else {
      console.log(`User joined session room: ${sessionId}`);
    }
  });

  // User visited event
  socket.on('user_visited', async (userData) => {
    const { sessionId, name, email, mobile } = userData;
    if (!sessionId) return;

    // Send WhatsApp alert if this is a new session visit
    if (!activeVisits.has(sessionId)) {
      activeVisits.add(sessionId);
      // Commented out to prevent WhatsApp notification spam on page load/visits
      /*
      await sendWhatsAppVisitNotification({
        name,
        email,
        mobile,
        eventType: 'Website Visit'
      });
      */
    }

    // Alert all connected admins
    io.to('admins').emit('session_active', {
      sessionId,
      user: { name, email, mobile },
      timestamp: new Date()
    });
  });

  // User sends a message
  socket.on('user_message', async (msgData) => {
    const { sessionId, userId, text, compatibilityCheck } = msgData;
    if (!sessionId || !text) return;

    try {
      const chatMsg = new ChatMessage({
        userId: userId || null,
        sessionId,
        role: 'user',
        text,
        compatibilityCheck: compatibilityCheck || null
      });
      await chatMsg.save();

      // Emit to rooms
      io.to(sessionId).emit('message_received', chatMsg);
      io.to('admins').emit('admin_session_update', { sessionId, message: chatMsg });
    } catch (err) {
      console.error('Error saving user message:', err);
    }
  });

  // AI responds
  socket.on('model_message', async (msgData) => {
    const { sessionId, userId, text } = msgData;
    if (!sessionId || !text) return;

    try {
      const chatMsg = new ChatMessage({
        userId: userId || null,
        sessionId,
        role: 'model',
        text
      });
      await chatMsg.save();

      // Emit to rooms
      io.to(sessionId).emit('message_received', chatMsg);
      io.to('admins').emit('admin_session_update', { sessionId, message: chatMsg });
    } catch (err) {
      console.error('Error saving model message:', err);
    }
  });

  // Admin takes over and chats directly
  socket.on('admin_message', async (msgData) => {
    const { sessionId, text } = msgData;
    if (!sessionId || !text) return;

    try {
      const chatMsg = new ChatMessage({
        sessionId,
        role: 'admin',
        text
      });
      await chatMsg.save();

      // Broadcast to the user room and admins
      io.to(sessionId).emit('message_received', chatMsg);
      io.to('admins').emit('admin_session_update', { sessionId, message: chatMsg });
    } catch (err) {
      console.error('Error saving admin message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Start server immediately so Render detects it as active
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Connect to MongoDB in the background
  console.log('Connecting to MongoDB...');
  mongoose.connect(mongoURI)
    .then(() => {
      console.log('Successfully connected to MongoDB.');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
    });
});
