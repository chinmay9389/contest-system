import mongoose, { Document, Schema } from 'mongoose';
import { IContest } from './contest.model';
import { IUser } from './user.model';

export interface ILeaderboardEntry extends Document {
  user: mongoose.Types.ObjectId;
  contest: mongoose.Types.ObjectId;
  score: number;
  answers: {
    questionId: mongoose.Types.ObjectId;
    selectedAnswers: string[];
    isCorrect: boolean;
    pointsEarned: number;
  }[];
  rank: number;
  createdAt: Date;
  updatedAt: Date;
}

const leaderboardEntrySchema = new Schema<ILeaderboardEntry>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    contest: {
      type: Schema.Types.ObjectId,
      ref: 'Contest',
      required: true
    },
    score: {
      type: Number,
      required: true,
      default: 0
    },
    answers: [{
      questionId: {
        type: Schema.Types.ObjectId,
        required: true
      },
      selectedAnswers: [{
        type: String,
        required: true
      }],
      isCorrect: {
        type: Boolean,
        required: true
      },
      pointsEarned: {
        type: Number,
        required: true,
        default: 0
      }
    }],
    rank: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Create compound index for user and contest
leaderboardEntrySchema.index({ user: 1, contest: 1 }, { unique: true });

// Create index for contest and score for efficient ranking queries
leaderboardEntrySchema.index({ contest: 1, score: -1 });

export const LeaderboardEntry = mongoose.model<ILeaderboardEntry>('LeaderboardEntry', leaderboardEntrySchema); 