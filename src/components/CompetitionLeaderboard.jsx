import React, { useState } from 'react';

export default function CompetitionLeaderboard({ users, sortBy = 'alphabetical' }) {
  const [currentSort, setCurrentSort] = useState(sortBy);

  // Calculate total questions (assuming questions are separated by newlines)
  const totalQuestions = users.length > 0 && users[0].totalQuestions 
    ? users[0].totalQuestions 
    : 10; // Default fallback

  // Calculate ranks based on correct answers
  const usersWithRanks = users.map(user => {
    // Calculate rank based on number of correct answers (higher = better rank)
    const betterUsers = users.filter(u => {
      if (u.correct > user.correct) return true;
      if (u.correct === user.correct && u.completed > user.completed) return true;
      if (u.correct === user.correct && u.completed === user.completed) {
        // If same correct and completed, rank alphabetically (earlier name = better)
        return u.fullName.localeCompare(user.fullName) < 0;
      }
      return false;
    });
    return { ...user, rank: betterUsers.length + 1 };
  });

  // Sort users based on current sort option
  const sortedUsers = [...usersWithRanks].sort((a, b) => {
    if (currentSort === 'alphabetical') {
      return a.fullName.localeCompare(b.fullName);
    } else if (currentSort === 'rank') {
      // Sort by number of correct answers (higher = better, rank 1 = best)
      if (b.correct !== a.correct) return b.correct - a.correct;
      // If same correct answers, sort by completed (higher = better)
      if (b.completed !== a.completed) return b.completed - a.completed;
      // If same correct and completed, sort alphabetically
      return a.fullName.localeCompare(b.fullName);
    } else if (currentSort === 'progress') {
      // Sort by progress - incomplete students first
      const aCompleted = a.completed || 0;
      const bCompleted = b.completed || 0;
      const aIsComplete = aCompleted >= totalQuestions;
      const bIsComplete = bCompleted >= totalQuestions;
      
      // Incomplete students come first
      if (aIsComplete !== bIsComplete) {
        return aIsComplete ? 1 : -1; // Incomplete (false) comes before complete (true)
      }
      
      // If both incomplete or both complete, sort by progress percentage (lower = incomplete first, higher = complete first)
      const aProgress = totalQuestions > 0 ? aCompleted / totalQuestions : 0;
      const bProgress = totalQuestions > 0 ? bCompleted / totalQuestions : 0;
      
      if (aIsComplete) {
        // Both complete: sort by progress descending (higher = better)
        if (bProgress !== aProgress) return bProgress - aProgress;
        // If same progress, sort by correct answers
        if (b.correct !== a.correct) return b.correct - a.correct;
      } else {
        // Both incomplete: sort by progress ascending (lower = needs more work)
        if (aProgress !== bProgress) return aProgress - bProgress;
        // If same progress, sort by correct answers
        if (a.correct !== b.correct) return a.correct - b.correct;
      }
      
      // Then alphabetically
      return a.fullName.localeCompare(b.fullName);
    }
    return 0;
  });

  return (
    <div className="flex flex-col">
      {/* Sort Options */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-medium text-gray-600">Sort by:</span>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentSort('alphabetical')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              currentSort === 'alphabetical'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Name
          </button>
          <button
            onClick={() => setCurrentSort('rank')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              currentSort === 'rank'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Rank
          </button>
          <button
            onClick={() => setCurrentSort('progress')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              currentSort === 'progress'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Progress
          </button>
        </div>
      </div>

      {/* User List */}
      <div className="space-y-2 pb-2">
        {sortedUsers.map((user, index) => {
          return (
            <div
              key={user.fullName}
              className="bg-white border border-gray-200 rounded-lg px-3 pt-3 pb-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Completion Icon */}
                  {(user.isCompleted || user.completed === totalQuestions) && (
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Name */}
                  <div className="flex-1">
                    <span className="text-xs font-medium text-gray-800">
                      {user.fullName}
                    </span>
                    {currentSort === 'rank' && user.rank && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        Rank #{user.rank}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-gray-600 flex-shrink-0">
                  <div className="text-right">
                    <div className="font-medium text-gray-800">{user.completed}/{totalQuestions}</div>
                    <div className="text-gray-500">Completed</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">{user.correct}</div>
                    <div className="text-gray-500">Correct</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

