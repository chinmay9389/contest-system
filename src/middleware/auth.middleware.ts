import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole, IUser } from '../models/user.model';
import { Contest, IContest } from '../models/contest.model';

export interface AuthRequest extends Request {
  user?: IUser;
  contest?: IContest;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    // Get fresh user data
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Set the user object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
};

export const checkContestAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const contestId = req.params.id;
  const contest = await Contest.findById(contestId);

  if (!contest) {
    return res.status(404).json({ message: 'Contest not found' });
  }

  if (contest.accessLevel === 'vip' && req.user.role !== UserRole.VIP && req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: 'This contest is only available for VIP users' });
  }

  req.contest = contest;
  next();
}; 