'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { LeaderboardEntry, Contest } from '@/lib/types';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useAuth();
  const [contestHistory, setContestHistory] = useState<LeaderboardEntry[]>([]);
  const [inProgressContests, setInProgressContests] = useState<Contest[]>([]);
  const [wonPrizes, setWonPrizes] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const [historyRes, inProgressRes, prizesRes] = await Promise.all([
        api.getUserContests(),
        api.getInProgressContests(),
        api.getUserPrizes(),
      ]);

      if (historyRes.data) setContestHistory(historyRes.data);
      if (inProgressRes.data) setInProgressContests(inProgressRes.data);
      if (prizesRes.data) setWonPrizes(prizesRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-4">
            <div className="sticky top-8">
              <div className="flex items-center">
                <div className="h-16 w-16 rounded-full bg-gray-500 flex items-center justify-center text-white text-2xl">
                  {user?.name[0].toUpperCase()}
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        user?.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : user?.role === 'vip'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {user?.role.toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Statistics</h3>
                  <dl className="mt-2 grid grid-cols-1 gap-4">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <dt className="text-sm font-medium text-gray-500">Total Contests</dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">
                        {contestHistory.length}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <dt className="text-sm font-medium text-gray-500">Won Prizes</dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">
                        {wonPrizes.length}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <dt className="text-sm font-medium text-gray-500">In Progress</dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">
                        {inProgressContests.length}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 lg:col-span-8 lg:mt-0">
            <div className="space-y-8">
              {inProgressContests.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900">In Progress Contests</h2>
                  <div className="mt-4 space-y-4">
                    {inProgressContests.map((contest) => (
                      <div
                        key={contest.id}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <h3 className="text-sm font-medium text-gray-900">
                          {contest.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {contest.description}
                        </p>
                        <div className="mt-4">
                          <Link
                            href={`/contests/${contest.id}`}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            Continue Contest
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-lg font-medium text-gray-900">Contest History</h2>
                <div className="mt-4 space-y-4">
                  {contestHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                          {entry.contest.name}
                        </h3>
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            entry.rank === 1
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          Rank {entry.rank}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Score: {entry.score} points
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Correct Answers: {entry.answers.filter((a) => a.isCorrect).length} /{' '}
                        {entry.answers.length}
                      </p>
                      <div className="mt-4">
                        <Link
                          href={`/contests/${entry.contest.id}/leaderboard`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          View Leaderboard
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {wonPrizes.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Won Prizes</h2>
                  <div className="mt-4 space-y-4">
                    {wonPrizes.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">
                            {entry.contest.name}
                          </h3>
                          <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-yellow-100 text-yellow-800">
                            First Place
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Prize: {entry.contest.prize.description} (${entry.contest.prize.value})
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Score: {entry.score} points
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 