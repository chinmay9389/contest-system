export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'vip' | 'normal';
  createdAt: string;
  updatedAt: string;
}

export interface Contest {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  accessLevel: 'vip' | 'normal';
  questions: Question[];
  prize: {
    description: string;
    value: number;
  };
  participants: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  type: 'single_select' | 'multi_select' | 'true_false';
  text: string;
  options: string[];
  points: number;
}

export interface LeaderboardEntry {
  id: string;
  user: User;
  contest: Contest;
  score: number;
  rank: number;
  answers: {
    questionId: string;
    selectedAnswers: string[];
    isCorrect: boolean;
    pointsEarned: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
} 