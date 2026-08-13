import express from 'express';
import mongoose from 'mongoose';
import ChatMessage from '../models/ChatMessage.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// GET /api/chats/gemini-key - Fetch global Gemini API Key
router.get('/gemini-key', authMiddleware, async (req, res) => {
  try {
    res.json({ apiKey: process.env.GEMINI_API_KEY || "" });
  } catch (error) {
    console.error("Error retrieving global API key:", error);
    res.status(500).json({ error: "Failed to retrieve configuration." });
  }
});

// GET /api/chats/sessions - Fetch distinct chat sessions for the logged-in user
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Group messages by sessionId to return unique sessions for this user
    const sessions = await ChatMessage.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$sessionId',
          lastMessage: { $first: '$text' },
          lastTimestamp: { $first: '$timestamp' }
        }
      },
      {
        $sort: { lastTimestamp: -1 }
      }
    ]);
    
    res.json(sessions.map(s => ({
      sessionId: s._id,
      lastMessage: s.lastMessage,
      lastTimestamp: s.lastTimestamp
    })));
  } catch (error) {
    console.error("Error fetching user chat sessions:", error);
    res.status(500).json({ error: 'Error fetching chat sessions.' });
  }
});

// GET /api/chats/history/:sessionId - Fetch full chat history for a session (must own it)
router.get('/history/:sessionId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    
    // Find all messages in this session
    const messages = await ChatMessage.find({ sessionId }).sort({ timestamp: 1 });
    
    // Verify that the messages belong to the logged-in user
    const belongsToUser = messages.every(m => !m.userId || m.userId.toString() === userId.toString());
    if (!belongsToUser && messages.length > 0) {
      return res.status(403).json({ error: 'Access denied. You do not own this chat session.' });
    }
    
    res.json(messages);
  } catch (error) {
    console.error("Error fetching session chat history:", error);
    res.status(500).json({ error: 'Error fetching chat history.' });
  }
});

export default router;
