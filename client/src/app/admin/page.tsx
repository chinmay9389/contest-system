'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Contest, User } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      if (user.role !== 'admin') {
        router.push('/');
        return;
      }
      fetchAdminData();
    }
  }, [user, router]);

  const fetchAdminData = async () => {
    try {
      const [contestsRes, usersRes] = await Promise.all([
        api.getContests(),
        api.getUsers(),
      ]);

      if (contestsRes.data) setContests(contestsRes.data);
      if (usersRes.data) setUsers(usersRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin data');
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

  const activeContests = contests.filter(
    (contest) =>
      new Date(contest.startTime) <= new Date() &&
      new Date(contest.endTime) >= new Date()
  );
  const upcomingContests = contests.filter(
    (contest) => new Date(contest.startTime) > new Date()
  );
  const endedContests = contests.filter(
    (contest) => new Date(contest.endTime) < new Date()
  );

  const vipUsers = users.filter((user) => user.role === 'vip');
  const regularUsers = users.filter((user) => user.role === 'normal');

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-semibold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage contests and monitor user activity.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <Link
              href="/admin/contests/new"
              className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Create Contest
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900">Contest Statistics</h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Active Contests</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {activeContests.length}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Upcoming Contests</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {upcomingContests.length}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Ended Contests</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {endedContests.length}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900">User Statistics</h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Users</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {users.length}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">VIP Users</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {vipUsers.length}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Regular Users</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {regularUsers.length}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900">Quick Actions</h3>
            <div className="mt-4 space-y-4">
              <Link
                href="/admin/contests"
                className="block text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Manage Contests
              </Link>
              <Link
                href="/admin/users"
                className="block text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Manage Users
              </Link>
              <Link
                href="/admin/leaderboard"
                className="block text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View Global Leaderboard
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900">Active Contests</h2>
          <div className="mt-4 space-y-4">
            {activeContests.map((contest) => (
              <div
                key={contest.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {contest.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {contest.description}
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <Link
                      href={`/admin/contests/${contest.id}/edit`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/contests/${contest.id}/leaderboard`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View Leaderboard
                    </Link>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Start Time:</span>{' '}
                    {new Date(contest.startTime).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">End Time:</span>{' '}
                    {new Date(contest.endTime).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Access Level:</span>{' '}
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        contest.accessLevel === 'vip'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {contest.accessLevel.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 