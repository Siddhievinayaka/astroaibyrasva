import express from 'express';
import User from '../models/User.js';
import ChatMessage from '../models/ChatMessage.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Middleware to verify user is an Admin
const verifyAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server validation error.' });
  }
};

// GET /api/admin/users - List all users
router.get('/users', authMiddleware, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users.' });
  }
});

// GET /api/admin/active-sessions - List distinct sessions with last message and user
router.get('/active-sessions', authMiddleware, verifyAdmin, async (req, res) => {
  try {
    const sessions = await ChatMessage.aggregate([
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$sessionId',
          lastMessage: { $first: '$text' },
          lastRole: { $first: '$role' },
          lastTimestamp: { $first: '$timestamp' },
          userId: { $first: '$userId' },
          compatibilityCheck: { $first: '$compatibilityCheck' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          sessionId: '$_id',
          lastMessage: 1,
          lastRole: 1,
          lastTimestamp: 1,
          compatibilityCheck: 1,
          user: {
            name: '$userDetails.name',
            email: '$userDetails.email',
            mobile: '$userDetails.mobile'
          }
        }
      },
      {
        $sort: { lastTimestamp: -1 }
      }
    ]);
    res.json(sessions);
  } catch (error) {
    console.error("Aggregation error:", error);
    res.status(500).json({ error: 'Error calculating active sessions.' });
  }
});

// GET /api/admin/chats/:sessionId - Fetch full chat history for a session
router.get('/chats/:sessionId', authMiddleware, verifyAdmin, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ sessionId: req.params.sessionId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching session chats.' });
  }
});

export default router;
