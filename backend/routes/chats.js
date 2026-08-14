import express from 'express';
import mongoose from 'mongoose';
import ChatMessage from '../models/ChatMessage.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Helper to load current keys pool dynamically
const getKeysPool = () => {
  const keysStr = process.env.GEMINI_KEYS || process.env.GEMINI_API_KEY || "";
  return keysStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
};

let activeKeyIndex = 0;

// GET /api/chats/gemini-key - Fetch active Gemini API Key from pool
router.get('/gemini-key', authMiddleware, async (req, res) => {
  try {
    const keys = getKeysPool();
    const activeKey = keys[activeKeyIndex] || "";
    res.json({ apiKey: activeKey });
  } catch (error) {
    console.error("Error retrieving global API key:", error);
    res.status(500).json({ error: "Failed to retrieve configuration." });
  }
});

// POST /api/chats/rotate-key - Rotate to the next Gemini API Key
router.post('/rotate-key', authMiddleware, async (req, res) => {
  try {
    const keys = getKeysPool();
    if (keys.length <= 1) {
      return res.json({ apiKey: keys[0] || "" });
    }

    activeKeyIndex = (activeKeyIndex + 1) % keys.length;
    console.log(`[KEY ROTATION] API Key rotated to index ${activeKeyIndex} (ending in ...${keys[activeKeyIndex].slice(-6)}) due to rate limits.`);
    res.json({ apiKey: keys[activeKeyIndex] });
  } catch (error) {
    console.error("Error rotating API key:", error);
    res.status(500).json({ error: "Failed to rotate configuration." });
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
