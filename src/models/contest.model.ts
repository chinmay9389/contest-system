import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from './user.model';

export enum ContestAccessLevel {
  VIP = 'vip',
  NORMAL = 'normal'
}

export enum QuestionType {
  SINGLE_SELECT = 'single_select',
  MULTI_SELECT = 'multi_select',
  TRUE_FALSE = 'true_false'
}

export interface IQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  type: QuestionType;
  text: string;
  options: string[];
  correctAnswers: string[];
  points: number;
}

export interface IContest extends Document {
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  accessLevel: ContestAccessLevel;
  questions: IQuestion[];
  prize: {
    description: string;
    value: number;
  };
  participants: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>({
  type: {
    type: String,
    enum: Object.values(QuestionType),
    required: true
  },
  text: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswers: [{
    type: String,
    required: true
  }],
  points: {
    type: Number,
    required: true,
    min: 1
  }
});

const contestSchema = new Schema<IContest>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    accessLevel: {
      type: String,
      enum: Object.values(ContestAccessLevel),
      required: true
    },
    questions: [questionSchema],
    prize: {
      description: {
        type: String,
        required: true
      },
      value: {
        type: Number,
        required: true,
        min: 0
      }
    },
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  {
    timestamps: true
  }
);

// Validate that endTime is after startTime
contestSchema.pre('save', function(next) {
  if (this.endTime <= this.startTime) {
    next(new Error('End time must be after start time'));
  }
  next();
});

export const Contest = mongoose.model<IContest>('Contest', contestSchema); 