import express from 'express';
import { body } from 'express-validator';
import mongoose from 'mongoose';
import { Contest, ContestAccessLevel, QuestionType } from '../models/contest.model';
import { LeaderboardEntry } from '../models/leaderboard.model';
import { authenticate, authorize, checkContestAccess, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';

const router = express.Router();

// Create new contest (Admin only)
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  [
    body('name').notEmpty().withMessage('Contest name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('endTime').isISO8601().withMessage('Valid end time is required'),
    body('accessLevel')
      .isIn(Object.values(ContestAccessLevel))
      .withMessage('Invalid access level'),
    body('questions').isArray().withMessage('Questions must be an array'),
    body('prize.description').notEmpty().withMessage('Prize description is required'),
    body('prize.value').isNumeric().withMessage('Prize value must be a number')
  ],
  async (req: AuthRequest, res: express.Response) => {
    try {
      const contest = new Contest(req.body);
      await contest.save();
      res.status(201).json(contest);
    } catch (error) {
      res.status(500).json({ message: 'Error creating contest' });
    }
  }
);

// Get all contests (filtered by user role)
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    let query = {};

    // If user is authenticated, filter based on role
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      const user = await User.findById(decoded.userId);

      if (user?.role === UserRole.NORMAL) {
        query = { accessLevel: ContestAccessLevel.NORMAL };
      }
    } else {
      // For guest users, only show normal contests
      query = { accessLevel: ContestAccessLevel.NORMAL };
    }

    const contests = await Contest.find(query)
      .select('-questions.correctAnswers')
      .sort({ startTime: -1 });
    res.json(contests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contests' });
  }
});

// Get contest by ID
router.get('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .select('-questions.correctAnswers');
    
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Check access level
    if (contest.accessLevel === ContestAccessLevel.VIP) {
      // If no token provided, deny access
      if (!req.headers.authorization) {
        return res.status(403).json({ message: 'This contest is only available for VIP users' });
      }

      // Verify token and check user role
      const token = req.headers.authorization.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      const user = await User.findById(decoded.userId);

      if (!user || (user.role !== UserRole.VIP && user.role !== UserRole.ADMIN)) {
        return res.status(403).json({ message: 'This contest is only available for VIP users' });
      }
    }

    res.json(contest);
  } catch (error) {
    console.error('Error fetching contest:', error);
    res.status(500).json({ message: 'Error fetching contest' });
  }
});

// Submit contest answers
router.post(
  '/:id/submit',
  authenticate,
  checkContestAccess,
  [
    body('answers').isArray().withMessage('Answers must be an array'),
    body('answers.*.questionId').notEmpty().withMessage('Question ID is required'),
    body('answers.*.selectedAnswers').isArray().withMessage('Selected answers must be an array')
  ],
  async (req: AuthRequest, res: express.Response) => {
    try {
      const contest = await Contest.findById(req.params.id);
      if (!contest) {
        return res.status(404).json({ message: 'Contest not found' });
      }

      // Check if contest is still active
      const now = new Date();
      if (now < contest.startTime || now > contest.endTime) {
        return res.status(400).json({ message: 'Contest is not active' });
      }

      // Check if user has already submitted
      const existingEntry = await LeaderboardEntry.findOne({
        user: req.user?._id,
        contest: contest._id
      });

      if (existingEntry) {
        return res.status(400).json({ message: 'You have already submitted answers for this contest' });
      }

      // Calculate score
      let totalScore = 0;
      const answers = req.body.answers.map((answer: any) => {
        const question = contest.questions.find(q => q._id.toString() === answer.questionId);
        if (!question) {
          throw new Error(`Invalid question ID: ${answer.questionId}`);
        }

        // Sort both arrays to ensure order doesn't matter
        const sortedSelected = [...answer.selectedAnswers].sort();
        const sortedCorrect = [...question.correctAnswers].sort();

        const isCorrect = JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
        const pointsEarned = isCorrect ? question.points : 0;
        totalScore += pointsEarned;

        return {
          questionId: answer.questionId,
          selectedAnswers: answer.selectedAnswers,
          isCorrect,
          pointsEarned
        };
      });

      // Calculate initial rank
      const existingEntries = await LeaderboardEntry.find({ contest: contest._id })
        .sort({ score: -1 });
      
      let initialRank = 1;
      for (const entry of existingEntries) {
        if (entry.score >= totalScore) {
          initialRank++;
        }
      }

      // Create leaderboard entry
      const leaderboardEntry = new LeaderboardEntry({
        user: req.user?._id,
        contest: contest._id,
        score: totalScore,
        answers,
        rank: initialRank
      });

      await leaderboardEntry.save();

      // Update contest participants
      if (req.user?._id) {
        const userId = new mongoose.Types.ObjectId(req.user._id.toString());
        contest.participants.push(userId);
        await contest.save();
      }

      res.status(201).json({
        message: 'Answers submitted successfully',
        score: totalScore,
        rank: initialRank,
        answers: answers
      });
    } catch (error) {
      console.error('Error submitting answers:', error);
      res.status(500).json({ 
        message: 'Error submitting answers',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get contest leaderboard
router.get('/:id/leaderboard', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const leaderboard = await LeaderboardEntry.find({ contest: req.params.id })
      .populate('user', 'name email')
      .sort({ score: -1 })
      .limit(10);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
});

export default router; 