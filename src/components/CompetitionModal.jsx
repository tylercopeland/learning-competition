import React, { useState, useEffect, useRef } from 'react';

export default function CompetitionModal({ 
  isOpen, 
  questions, 
  duration, 
  onClose, 
  onBackdropClick, 
  studentName, 
  onSubmitAnswers,
  currentQuestionIndex: propCurrentQuestionIndex,
  onQuestionIndexChange,
  answers: propAnswers,
  onAnswersChange
}) {
  // Use local state as fallback if props not provided
  const [localQuestionIndex, setLocalQuestionIndex] = useState(0);
  const [localAnswers, setLocalAnswers] = useState({});
  
  // Use props if provided, otherwise use local state
  const currentQuestionIndex = propCurrentQuestionIndex !== undefined ? propCurrentQuestionIndex : localQuestionIndex;
  const answers = propAnswers !== undefined ? propAnswers : localAnswers;
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // Convert minutes to seconds
  const timerIntervalRef = useRef(null);
  
  // Countdown timer effect
  useEffect(() => {
    if (!isOpen || isSubmitted) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    // Reset timer when modal opens
    setTimeRemaining(duration * 60);

    // Start countdown
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isOpen, duration, isSubmitted]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleQuestionIndexChange = (index) => {
    if (onQuestionIndexChange) {
      onQuestionIndexChange(index);
    } else {
      setLocalQuestionIndex(index);
    }
  };
  
  const handleAnswersChange = (newAnswers) => {
    if (onAnswersChange) {
      onAnswersChange(newAnswers);
    } else {
      setLocalAnswers(newAnswers);
    }
  };
  
  if (!isOpen || !questions || questions.length === 0) return null;

  const currentQuestion = questions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  
  // Check if all questions are answered
  const allQuestionsAnswered = questions.every(q => answers[q.id] && answers[q.id].trim() !== '');

  const handleAnswerChange = (value) => {
    handleAnswersChange({
      ...answers,
      [currentQuestion.id]: value
    });
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      handleQuestionIndexChange(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      handleQuestionIndexChange(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    
    // Calculate correct answers
    let correctCount = 0;
    questions.forEach(question => {
      const studentAnswer = answers[question.id];
      if (studentAnswer) {
        // Normalize answers for comparison
        const normalizedStudentAnswer = studentAnswer.trim().toLowerCase();
        const normalizedCorrectAnswer = question.correctAnswer.trim().toLowerCase();
        
        // For free-text questions, also check numeric equivalence (e.g., "1.25" vs "1 1/4")
        if (normalizedStudentAnswer === normalizedCorrectAnswer) {
          correctCount++;
        } else if (question.type === 'free-text') {
          // Try numeric comparison for free-text answers
          const studentNum = parseFloat(normalizedStudentAnswer);
          const correctNum = parseFloat(normalizedCorrectAnswer);
          if (!isNaN(studentNum) && !isNaN(correctNum) && Math.abs(studentNum - correctNum) < 0.01) {
            correctCount++;
          }
        }
      }
    });
    
    // Call onSubmitAnswers callback with results
    if (onSubmitAnswers) {
      onSubmitAnswers({
        studentName,
        completed: questions.length,
        correct: correctCount,
        totalQuestions: questions.length
      });
    }
  };

  const currentAnswer = answers[currentQuestion.id] || '';

  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget && onBackdropClick) {
      onBackdropClick();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pointer-events-auto"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Learning Competition</h2>
              <p className="text-sm text-gray-600 mt-1">Question {currentQuestionIndex + 1} of {questions.length}</p>
            </div>
          </div>
          {/* Timer Countdown */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-lg font-semibold ${
            timeRemaining <= 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatTime(timeRemaining)}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              {currentQuestion.question}
            </h3>

            {currentQuestion.type === 'multiple-choice' ? (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      currentAnswer === option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={currentAnswer === option}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={currentAnswer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Enter your answer..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          {isSubmitted ? (
            <div className="w-full text-center">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-semibold">Answers Submitted!</span>
              </div>
              <p className="text-sm text-gray-600">Thank you for completing the competition.</p>
            </div>
          ) : (
            <>
              <button
                onClick={handlePrevious}
                disabled={isFirstQuestion}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              <div className="flex flex-col items-center gap-1">
                <div className="text-sm text-gray-600">
                  {currentQuestionIndex + 1} / {questions.length}
                </div>
              </div>

              {isLastQuestion ? (
                <button
                  onClick={handleSubmit}
                  disabled={!allQuestionsAnswered}
                  className={`px-6 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    allQuestionsAnswered
                      ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Submit
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  Next
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
