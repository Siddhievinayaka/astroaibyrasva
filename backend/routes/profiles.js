import express from 'express';
import Profile from '../models/Profile.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/profiles
// Retrieve all profiles belonging to the logged-in user
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(profiles);
  } catch (err) {
    console.error('Fetch profiles error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/profiles
// Create a new birth profile under the logged-in user's account
router.post('/', async (req, res) => {
  try {
    const { name, date, time, latitude, longitude, timezone, locationName } = req.body;

    if (!name || !date || !time || latitude === undefined || longitude === undefined || timezone === undefined || !locationName) {
      return res.status(400).json({ error: 'All birth details are required.' });
    }

    const newProfile = new Profile({
      userId: req.user.id,
      name,
      date,
      time,
      latitude,
      longitude,
      timezone,
      locationName
    });

    await newProfile.save();
    res.status(201).json(newProfile);
  } catch (err) {
    console.error('Create profile error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/profiles/:id
// Delete a profile belonging to the logged-in user
router.delete('/:id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ _id: req.params.id, userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found or access denied.' });
    }

    await Profile.deleteOne({ _id: req.params.id });
    res.json({ message: 'Profile deleted successfully.' });
  } catch (err) {
    console.error('Delete profile error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
