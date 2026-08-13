import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'model', 'admin'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  compatibilityCheck: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
});

// Compound index to fetch session logs in chronological order quickly
ChatMessageSchema.index({ sessionId: 1, timestamp: 1 });

export default mongoose.model('ChatMessage', ChatMessageSchema);
