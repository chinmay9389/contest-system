import express from 'express';
import { User } from '../models/user.model';
import { Contest } from '../models/contest.model';
import { LeaderboardEntry } from '../models/leaderboard.model';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';
import { body } from 'express-validator';

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Update user profile
router.patch(
  '/profile',
  authenticate,
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please enter a valid email')
  ],
  async (req: AuthRequest, res: express.Response) => {
    try {
      const updates = req.body;
      delete updates.password; // Prevent password update through this route
      delete updates.role; // Prevent role update through this route

      const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error updating user profile' });
    }
  }
);

// Get user's contest history
router.get('/contests', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const leaderboardEntries = await LeaderboardEntry.find({ user: req.user?._id })
      .populate('contest', 'name description startTime endTime prize')
      .sort({ createdAt: -1 });

    res.json(leaderboardEntries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contest history' });
  }
});

// Get user's in-progress contests
router.get('/contests/in-progress', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    // Get all contests where user has submitted answers
    const leaderboardEntries = await LeaderboardEntry.find({ 
      user: req.user?._id 
    }).populate('contest');

    // Get contests where user has started but not completed
    const inProgressContests = leaderboardEntries
      .filter(entry => {
        const contest = entry.contest as any;
        return entry.answers.length > 0 && entry.answers.length < contest.questions.length;
      })
      .map(entry => entry.contest);

    res.json(inProgressContests);
  } catch (error) {
    console.error('Error fetching in-progress contests:', error);
    res.status(500).json({ message: 'Error fetching in-progress contests' });
  }
});

// Get user's won prizes
router.get('/prizes', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const leaderboardEntries = await LeaderboardEntry.find({
      user: req.user?._id,
      rank: 1
    })
      .populate('contest', 'name prize')
      .sort({ createdAt: -1 });

    res.json(leaderboardEntries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching won prizes' });
  }
});

// Admin: Get all users
router.get('/', authenticate, authorize(UserRole.ADMIN), async (req: AuthRequest, res: express.Response) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Admin: Update user role
router.patch(
  '/:id/role',
  authenticate,
  authorize(UserRole.ADMIN),
  [
    body('role')
      .isIn(Object.values(UserRole))
      .withMessage('Invalid role')
  ],
  async (req: AuthRequest, res: express.Response) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: { role: req.body.role } },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error updating user role' });
    }
  }
);

export default router; 