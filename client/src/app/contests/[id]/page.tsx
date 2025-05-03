'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Contest, Question } from '@/lib/types';
import { useAuth } from '@/lib/auth';

interface Answer {
  questionId: string;
  selectedAnswers: string[];
}

export default function ContestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchContest();
  }, [id]);

  const fetchContest = async () => {
    try {
      const { data, error } = await api.getContest(id as string);
      if (error) throw new Error(error);
      if (data) {
        setContest(data);
        // Initialize answers array
        setAnswers(
          data.questions.map((q) => ({
            questionId: q.id,
            selectedAnswers: [],
          }))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contest');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, selectedAnswers: string[]) => {
    setAnswers((prev) =>
      prev.map((answer) =>
        answer.questionId === questionId
          ? { ...answer, selectedAnswers }
          : answer
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const { data, error } = await api.submitAnswers(id as string, answers);
      if (error) throw new Error(error);
      if (data) {
        router.push(`/contests/${id}/leaderboard`);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit answers');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error || 'Contest not found'}</div>
      </div>
    );
  }

  const now = new Date();
  const startTime = new Date(contest.startTime);
  const endTime = new Date(contest.endTime);
  const isActive = now >= startTime && now <= endTime;
  const isUpcoming = now < startTime;
  const isEnded = now > endTime;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-4">
            <div className="sticky top-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {contest.name}
              </h1>
              <p className="mt-4 text-gray-500">{contest.description}</p>
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Prize</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {contest.prize.description} (${contest.prize.value})
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Access Level</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        contest.accessLevel === 'vip'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {contest.accessLevel.toUpperCase()}
                    </span>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Status</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        isActive
                          ? 'bg-green-100 text-green-800'
                          : isUpcoming
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Ended'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 lg:col-span-8 lg:mt-0">
            {isActive ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                {submitError && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{submitError}</div>
                  </div>
                )}
                {contest.questions.map((question, index) => (
                  <div key={question.id} className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Question {index + 1}
                    </h3>
                    <p className="text-gray-500">{question.text}</p>
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <div key={option} className="flex items-center">
                          <input
                            type={question.type === 'multi_select' ? 'checkbox' : 'radio'}
                            name={`question-${question.id}`}
                            value={option}
                            checked={answers
                              .find((a) => a.questionId === question.id)
                              ?.selectedAnswers.includes(option)}
                            onChange={(e) => {
                              const currentAnswers = answers.find(
                                (a) => a.questionId === question.id
                              )?.selectedAnswers || [];
                              const newAnswers = question.type === 'multi_select'
                                ? e.target.checked
                                  ? [...currentAnswers, option]
                                  : currentAnswers.filter((a) => a !== option)
                                : [option];
                              handleAnswerChange(question.id, newAnswers);
                            }}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <label className="ml-3 text-sm text-gray-700">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Answers'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {isUpcoming ? 'Contest has not started yet' : 'Contest has ended'}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {isUpcoming
                    ? `The contest will start on ${new Date(
                        contest.startTime
                      ).toLocaleString()}`
                    : `The contest ended on ${new Date(
                        contest.endTime
                      ).toLocaleString()}`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 