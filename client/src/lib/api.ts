import { ApiResponse, AuthResponse, Contest, LeaderboardEntry, User } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Something went wrong' };
  }
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, name: string, type: string) =>
    fetchApi<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, type }),
    }),

  getCurrentUser: () => fetchApi<User>('/auth/me'),

  // Contests
  getContests: () => fetchApi<Contest[]>('/contests'),
  getContest: (id: string) => fetchApi<Contest>(`/contests/${id}`),
  submitAnswers: (contestId: string, answers: any) =>
    fetchApi<{ message: string; score: number; rank: number }>(`/contests/${contestId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  // Leaderboard
  getLeaderboard: (contestId: string) =>
    fetchApi<LeaderboardEntry[]>(`/contests/${contestId}/leaderboard`),

  // User
  getUserProfile: () => fetchApi<User>('/users/profile'),
  updateUserProfile: (data: Partial<User>) =>
    fetchApi<User>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getUserContests: () => fetchApi<LeaderboardEntry[]>('/users/contests'),
  getInProgressContests: () => fetchApi<Contest[]>('/users/contests/in-progress'),
  getUserPrizes: () => fetchApi<LeaderboardEntry[]>('/users/prizes'),
  getUsers: () => fetchApi<User[]>('/users'),
}; 