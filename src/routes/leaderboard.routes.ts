import express from 'express';
import { LeaderboardEntry } from '../models/leaderboard.model';
import { Contest } from '../models/contest.model';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Get global leaderboard (top performers across all contests)
router.get('/global', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const leaderboard = await LeaderboardEntry.aggregate([
      {
        $group: {
          _id: '$user',
          totalScore: { $sum: '$score' },
          contestsParticipated: { $sum: 1 },
          firstPlaceFinishes: {
            $sum: { $cond: [{ $eq: ['$rank', 1] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $project: {
          _id: 1,
          name: '$userDetails.name',
          email: '$userDetails.email',
          totalScore: 1,
          contestsParticipated: 1,
          firstPlaceFinishes: 1
        }
      },
      {
        $sort: { totalScore: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching global leaderboard' });
  }
});

// Get contest-specific leaderboard
router.get('/contest/:contestId', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const contest = await Contest.findById(req.params.contestId);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    const leaderboard = await LeaderboardEntry.find({ contest: req.params.contestId })
      .populate('user', 'name email')
      .sort({ score: -1 })
      .limit(10);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contest leaderboard' });
  }
});

// Admin: Update leaderboard ranks
router.post(
  '/update-ranks',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: express.Request, res: express.Response) => {
    try {
      const contests = await Contest.find();
      
      for (const contest of contests) {
        const entries = await LeaderboardEntry.find({ contest: contest._id })
          .sort({ score: -1 });

        for (let i = 0; i < entries.length; i++) {
          entries[i].rank = i + 1;
          await entries[i].save();
        }
      }

      res.json({ message: 'Leaderboard ranks updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating leaderboard ranks' });
    }
  }
);

// Get user's ranking in a specific contest
router.get('/contest/:contestId/user/:userId', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const entry = await LeaderboardEntry.findOne({
      contest: req.params.contestId,
      user: req.params.userId
    }).populate('user', 'name email');

    if (!entry) {
      return res.status(404).json({ message: 'User has not participated in this contest' });
    }

    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user ranking' });
  }
});

// Get all leaderboards
router.get('/', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const leaderboards = await LeaderboardEntry.find()
      .populate('user', 'name email')
      .populate('contest', 'name')
      .sort({ score: -1 });
    res.json(leaderboards);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaderboards' });
  }
});

export default router; 