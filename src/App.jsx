import React, { useState, useEffect, useRef } from 'react';
// Learning Competition Application
import Layout from './components/Layout';
import Presentation from './components/Presentation';
import RoomDetails from './components/RoomDetails';
import ParticipantsGrid from './components/ParticipantsGrid';
import CompetitionModal from './components/CompetitionModal';
import CompetitionLeaderboard from './components/CompetitionLeaderboard';
import { generateGrade6MathQuestions } from './utils/questionGenerator';

// Sample data with full names
const initialRooms = [
  {
    id: 1,
    name: 'Room Alpha',
    participants: [
      { fullName: 'Alice Anderson', initials: 'AA' },
      { fullName: 'Bob Brown', initials: 'BB' }
    ]
  },
  {
    id: 2,
    name: 'Room Beta',
    participants: [
      { fullName: 'Charlie Chen', initials: 'CC' }
    ]
  },
  {
    id: 3,
    name: 'Room Gamma',
    participants: [
      { fullName: 'Diana Davis', initials: 'DD' },
      { fullName: 'Eve Evans', initials: 'EE' },
      { fullName: 'Frank Foster', initials: 'FF' }
    ]
  },
  {
    id: 4,
    name: 'Room Delta',
    participants: [],
    hasActivity: false // Example: No activity
  },
  {
    id: 5,
    name: 'Room Epsilon',
    participants: [
      { fullName: 'Grace Green', initials: 'GG' }
    ]
  }
];

const initialAvailableUsers = [
  { name: 'Hannah Harris', initial: 'HH' },
  { name: 'Ian Ingram', initial: 'II' },
  { name: 'Jack Johnson', initial: 'JJ' },
  { name: 'Kate Kelly', initial: 'KK' },
  { name: 'Liam Lee', initial: 'LL' }
];

const teacher = {
  name: 'Teacher',
  fullName: 'Teacher Name',
  initials: 'TN'
};

function App() {
  const [rooms, setRooms] = useState(initialRooms);
  const [availableUsers, setAvailableUsers] = useState(initialAvailableUsers);
  const [showBreakoutPanel, setShowBreakoutPanel] = useState(false);
  const [showUsersPanel, setShowUsersPanel] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [activeTab, setActiveTab] = useState('presentation');
  const [roomScreenshare, setRoomScreenshare] = useState({}); // Store screenshare state per room: { roomId: boolean }
  const [roomNotes, setRoomNotes] = useState({}); // Store notes per room: { roomId: notes }
  const [teacherRoomId, setTeacherRoomId] = useState(null); // Track which room the teacher is in
  const [competitionQuestions, setCompetitionQuestions] = useState(''); // Questions for the learning competition
  const [parsedQuestions, setParsedQuestions] = useState([]); // Parsed question objects
  const [competitionDuration, setCompetitionDuration] = useState(5); // Duration in minutes
  const [timeRemaining, setTimeRemaining] = useState(null); // Remaining time in seconds
  const [isCompetitionRunning, setIsCompetitionRunning] = useState(false); // Whether competition is active
  const timerIntervalRef = useRef(null); // Timer interval reference
  const [currentView, setCurrentView] = useState('teacher'); // Current view: 'teacher' or 'student'
  const [competitionUsers, setCompetitionUsers] = useState([]); // User progress data for competition
  const [showCompetitionModal, setShowCompetitionModal] = useState(true); // Control modal visibility
  const [studentAnswers, setStudentAnswers] = useState({}); // Store student answers: { questionId: answer }
  const [studentCurrentQuestionIndex, setStudentCurrentQuestionIndex] = useState(0); // Current question index for student
  const [showEndConfirmation, setShowEndConfirmation] = useState(false); // Show confirmation dialog for ending competition
  const [chatMessages, setChatMessages] = useState([]); // Chat messages array

  const handleUserDrop = (roomId, userName) => {
    // Check if the dragged user is the teacher
    const isTeacher = userName === teacher.fullName;
    
    // Check if user is in available users
    const availableUser = availableUsers.find(u => u.name === userName);
    
    if (isTeacher) {
        // Teacher is being moved to the target room
        const isDifferentRoom = teacherRoomId !== roomId;
        setTeacherRoomId(roomId);
        // Also select the room when teacher is dragged to it
        setSelectedRoomId(roomId);
        // Reset active tab when switching to a different room
        if (isDifferentRoom) {
          setActiveTab('presentation');
        }
    } else if (availableUser) {
      // Remove from available users
      setAvailableUsers(prev => prev.filter(u => u.name !== userName));
      
      // Add to target room
      const userObj = {
        fullName: availableUser.name,
        initials: availableUser.initial || getInitials(availableUser.name)
      };
      
      setRooms(prevRooms =>
        prevRooms.map(room => {
          if (room.id === roomId) {
            // Add user to target room if not already present
            const isPresent = room.participants.some(p => 
              (typeof p === 'string' ? p : p.fullName || p.name) === userName
            );
            if (!isPresent) {
              return {
                ...room,
                participants: [...room.participants, userObj]
              };
            }
            return room;
          } else {
            // Remove user from all other rooms
            return {
              ...room,
              participants: room.participants.filter(p => {
                const pName = typeof p === 'string' ? p : p.fullName || p.name;
                return pName !== userName;
              })
            };
          }
        })
      );
    } else {
      // User is being moved from another room
      setRooms(prevRooms => {
        let userToMove = null;
        const roomsWithoutUser = prevRooms.map(room => {
          const participant = room.participants.find(p => {
            const pName = typeof p === 'string' ? p : p.fullName || p.name;
            return pName === userName;
          });
          if (participant && room.id !== roomId) {
            userToMove = typeof participant === 'string' 
              ? { fullName: participant, initials: getInitials(participant) }
              : participant;
          }
          return {
            ...room,
            participants: room.participants.filter(p => {
              const pName = typeof p === 'string' ? p : p.fullName || p.name;
              return pName !== userName;
            })
          };
        });
        
        if (userToMove) {
          return roomsWithoutUser.map(room => {
            if (room.id === roomId) {
              const isPresent = room.participants.some(p => {
                const pName = typeof p === 'string' ? p : p.fullName || p.name;
                return pName === userName;
              });
              if (!isPresent) {
                return {
                  ...room,
                  participants: [...room.participants, userToMove]
                };
              }
            }
            return room;
          });
        }
        return roomsWithoutUser;
      });
    }
  };

  const getInitials = (fullName) => {
    if (!fullName) return '??';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return fullName.charAt(0).toUpperCase() + (fullName.length > 1 ? fullName.charAt(1) : '');
  };

  const handleUserRemoveFromRoom = (userName) => {
    // Add user back to available users if they're not already there
    setAvailableUsers(prev => {
      if (!prev.some(u => u.name === userName)) {
        const userInitial = getInitials(userName);
        return [...prev, { name: userName, initial: userInitial }];
      }
      return prev;
    });
  };

  const handleDropToAvailable = (userName) => {
    // Check if the dropped user is the teacher
    const isTeacher = userName === teacher.fullName;
    
    if (isTeacher) {
      // Move teacher back to available (no room)
      setTeacherRoomId(null);
    } else {
      // Remove user from all rooms
      setRooms(prevRooms =>
        prevRooms.map(room => ({
          ...room,
          participants: room.participants.filter(p => {
            const pName = typeof p === 'string' ? p : p.fullName || p.name;
            return pName !== userName;
          })
        }))
      );

      // Add user back to available users
      handleUserRemoveFromRoom(userName);
    }
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  // Handle random assignment of available users to rooms
  const handleRandomAssign = () => {
    if (availableUsers.length === 0 || rooms.length === 0) {
      return; // Nothing to assign or no rooms available
    }

    // Filter out teacher from available users (just in case)
    const usersToAssign = availableUsers.filter(user => user.name !== teacher.fullName);
    
    if (usersToAssign.length === 0) {
      return; // No users to assign
    }

    // Create a shuffled copy of users to assign
    const shuffledUsers = [...usersToAssign].sort(() => Math.random() - 0.5);
    
    // Distribute users evenly across rooms
    const updatedRooms = rooms.map((room, index) => {
      const usersPerRoom = Math.floor(shuffledUsers.length / rooms.length);
      const startIndex = index * usersPerRoom;
      const endIndex = index === rooms.length - 1 
        ? shuffledUsers.length 
        : startIndex + usersPerRoom;
      
      const assignedUsers = shuffledUsers.slice(startIndex, endIndex).map(user => ({
        fullName: user.name,
        initials: user.initial || getInitials(user.name)
      }));

      return {
        ...room,
        participants: [...room.participants, ...assignedUsers],
        hasActivity: assignedUsers.length > 0 ? true : room.hasActivity
      };
    });

    setRooms(updatedRooms);
    setAvailableUsers([]); // Clear available users as they're all assigned
  };

  // Get all users (available + in rooms + teacher)
  const getAllUsers = () => {
    const users = [];
    
    // Add teacher
    if (teacher) {
      users.push({
        fullName: teacher.fullName,
        initials: teacher.initials,
        isTeacher: true
      });
    }
    
    // Add available users
    availableUsers.forEach(user => {
      users.push({
        fullName: user.name,
        initials: user.initial || getInitials(user.name)
      });
    });
    
    // Add users from all rooms
    rooms.forEach(room => {
      room.participants.forEach(participant => {
        const fullName = typeof participant === 'string' ? participant : participant.fullName || participant.name;
        const initials = typeof participant === 'object' && participant.initials 
          ? participant.initials 
          : getInitials(fullName);
        
        // Check if user already exists
        if (!users.some(u => u.fullName === fullName)) {
          users.push({ fullName, initials });
        }
      });
    });
    
    return users;
  };

  const chatContent = (panelWidth) => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-800">
          Chat
        </h2>
        {currentView === 'teacher' && (
          <button
            onClick={() => setShowChatPanel(false)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Close panel"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto mb-4">
        {chatMessages.length > 0 ? (
          <div className="space-y-3">
            {chatMessages.map((message, index) => {
              const lines = message.text.split('\n');
              const headerLine = lines[0].replace(/🏆/g, '').trim();
              const resultLines = lines.slice(1);
              
              return (
                <div key={index} className="flex flex-col">
                  <div className="text-xs text-gray-500 mb-1">{message.sender}</div>
                  <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-800">
                    <div className="text-xs uppercase mb-2 font-semibold">{headerLine}</div>
                    <div className="space-y-1">
                      {resultLines.map((line, lineIndex) => {
                        if (!line.trim()) return null;
                        const trimmedLine = line.trim().replace(/\s+correct/g, '');
                        
                        // Check if line starts with medal emoji or number
                        const startsWithMedal = /^[🥇🥈🥉]/.test(trimmedLine);
                        const startsWithNumber = /^\d+\./.test(trimmedLine);
                        
                        if (startsWithMedal || startsWithNumber) {
                          // Split by whitespace - first part is rank/medal, last part is answer, middle is name
                          const parts = trimmedLine.split(/\s+/);
                          if (parts.length >= 3) {
                            const rank = parts[0];
                            const answer = parts[parts.length - 1]; // Last part is "X/Y"
                            const name = parts.slice(1, -1).join(' '); // Everything in between is the name
                            
                            return (
                              <div key={lineIndex} className="flex items-center justify-between font-mono text-xs w-full">
                                <span className="flex-shrink-0">{rank} {name}</span>
                                <span className="ml-auto flex-shrink-0">{answer}</span>
                              </div>
                            );
                          }
                        }
                        
                        // Fallback: display as-is
                        return (
                          <div key={lineIndex} className="font-mono text-xs whitespace-pre-line">{trimmedLine}</div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 pt-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex-shrink-0"
            title="Send message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  const usersContent = (panelWidth) => showUsersPanel ? (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-800">
          Users
        </h2>
        <button
          onClick={() => setShowUsersPanel(false)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Close panel"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="space-y-2">
        {getAllUsers().map((user, index) => (
          <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded transition-colors">
            {user.isTeacher ? (
              <div className="w-10 h-10 rounded bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium">{user.initials}</span>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium">{user.initials}</span>
              </div>
            )}
            <span className="text-sm text-gray-700 font-medium">{user.fullName}</span>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  // Calculate and update ranks based on performance
  const calculateRanks = (users) => {
    // Sort by performance: first by correct answers (desc), then by completed (desc), then by accuracy
    const sorted = [...users].sort((a, b) => {
      // Primary: correct answers
      if (b.correct !== a.correct) {
        return b.correct - a.correct;
      }
      // Secondary: completed count
      if (b.completed !== a.completed) {
        return b.completed - a.completed;
      }
      // Tertiary: accuracy percentage
      const aAccuracy = a.completed > 0 ? a.correct / a.completed : 0;
      const bAccuracy = b.completed > 0 ? b.correct / b.completed : 0;
      return bAccuracy - aAccuracy;
    });

    // Assign ranks (handle ties)
    let currentRank = 1;
    return sorted.map((user, index) => {
      if (index > 0) {
        const prevUser = sorted[index - 1];
        const prevCorrect = prevUser.correct;
        const prevCompleted = prevUser.completed;
        const prevAccuracy = prevCompleted > 0 ? prevCorrect / prevCompleted : 0;
        
        const userCorrect = user.correct;
        const userCompleted = user.completed;
        const userAccuracy = userCompleted > 0 ? userCorrect / userCompleted : 0;
        
        // Only increment rank if performance is different
        if (prevCorrect !== userCorrect || prevCompleted !== userCompleted || prevAccuracy !== userAccuracy) {
          currentRank = index + 1;
        }
      } else {
        currentRank = 1;
      }
      
      return {
        ...user,
        rank: currentRank
      };
    });
  };

  const handleStartCompetition = () => {
    // Use parsed questions if available, otherwise generate default
    let questionsToUse = parsedQuestions.length > 0 ? parsedQuestions : generateGrade6MathQuestions();
    
    // Ensure parsed questions are set
    if (parsedQuestions.length === 0) {
      setParsedQuestions(questionsToUse);
      setCompetitionQuestions(JSON.stringify(questionsToUse, null, 2));
    }
    
    // Get all students (excluding teacher)
    const allUsers = getAllUsers();
    const students = allUsers.filter(user => !user.isTeacher);
    
    // Count questions
    const questionCount = questionsToUse.length;
    
    // Initialize competition user data with default values
    const initialCompetitionUsers = students.map((student) => ({
      fullName: student.fullName,
      initials: student.initials,
      completed: 0,
      correct: 0,
      rank: 1, // Will be recalculated when there's actual data
      totalQuestions: questionCount
    }));
    
    // Sort alphabetically initially
    const sortedAlphabetically = initialCompetitionUsers.sort((a, b) => 
      a.fullName.localeCompare(b.fullName)
    );
    
    // Reset student state when starting new competition
    setStudentAnswers({});
    setStudentCurrentQuestionIndex(0);
    
    // Reset simulation progress
    studentProgressRef.current = {};
    
    // Reset confirmation state
    setShowEndConfirmation(false);
    
    setCompetitionUsers(sortedAlphabetically);
    setIsCompetitionRunning(true);
    setShowCompetitionModal(true); // Show modal when competition starts
    
    // Start countdown timer
    setTimeRemaining(competitionDuration * 60); // Convert minutes to seconds
    // TODO: Implement competition start logic and real-time updates
  };

  const handleEndCompetition = () => {
    setShowEndConfirmation(true);
  };

  // Get ranked list of students
  const getRankedStudents = () => {
    return [...competitionUsers].sort((a, b) => {
      if (b.correct !== a.correct) return b.correct - a.correct;
      if (b.completed !== a.completed) return b.completed - a.completed;
      return a.fullName.localeCompare(b.fullName);
    });
  };

  const handleConfirmEnd = (shareResults) => {
    setIsCompetitionRunning(false);
    setShowEndConfirmation(false);
    setTimeRemaining(null); // Stop timer
    
    if (shareResults) {
      // Sort users by correct answers (rank)
      const sortedByRank = getRankedStudents();

      // Format ranking message
      // Find longest name for alignment
      const maxNameLength = sortedByRank.length > 0 
        ? Math.max(...sortedByRank.map(user => user.fullName.length))
        : 0;
      
      // Calculate max width for correct answers (e.g., "5/5 correct" = 13 chars)
      const maxAnswerLength = 13; // "X/Y correct" format
      
      let rankingMessage = "LEARNING COMPETITION RESULTS\n";
      sortedByRank.forEach((user, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}.`;
        const answerText = `${user.correct}/${user.completed}`;
        const namePadding = ' '.repeat(Math.max(0, maxNameLength - user.fullName.length + 2));
        rankingMessage += `${medal} ${user.fullName}${namePadding}${answerText}\n`;
      });

      // Add message to chat
      setChatMessages(prev => [...prev, {
        sender: teacher.fullName,
        text: rankingMessage,
        timestamp: new Date()
      }]);

      // Close Learning Competition panel and open chat panel to show results
      setShowBreakoutPanel(false);
      setShowChatPanel(true);
    }
  };

  const handleCancelEnd = () => {
    setShowEndConfirmation(false);
  };

  // Simulate other students answering questions
  const simulationIntervalRef = useRef(null);
  const studentProgressRef = useRef({}); // Track simulated progress per student

  useEffect(() => {
    if (!isCompetitionRunning || parsedQuestions.length === 0) {
      // Clear timeout if competition stops
      if (simulationIntervalRef.current) {
        clearTimeout(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      // Reset simulation progress when competition stops
      studentProgressRef.current = {};
      return;
    }

    // Initialize simulation progress for all students except Alice Anderson
    setCompetitionUsers(prevUsers => {
      const otherStudents = prevUsers.filter(user => user.fullName !== 'Alice Anderson');
      otherStudents.forEach(student => {
        if (!studentProgressRef.current[student.fullName]) {
          studentProgressRef.current[student.fullName] = {
            completed: 0,
            correct: 0,
            totalQuestions: parsedQuestions.length
          };
        }
      });
      return prevUsers; // Return unchanged to avoid unnecessary re-render
    });

    // Simulate students answering questions at random intervals
    const scheduleNextUpdate = () => {
      // Clear any existing timeout
      if (simulationIntervalRef.current) {
        clearTimeout(simulationIntervalRef.current);
      }

      // Schedule next update with random delay (faster updates)
      const delay = 300 + Math.random() * 700; // Random interval between 0.3-1 seconds
      
      simulationIntervalRef.current = setTimeout(() => {
        setCompetitionUsers(prevUsers => {
          const otherStudents = prevUsers.filter(user => user.fullName !== 'Alice Anderson');
          if (otherStudents.length === 0) {
            return prevUsers;
          }

          // Check if all other students have completed (excluding Alice Anderson)
          // Check both ref and state to ensure accuracy
          const allOtherStudentsCompleted = otherStudents.every(student => {
            const refProgress = studentProgressRef.current[student.fullName];
            const stateProgress = student.completed || 0;
            const completed = refProgress?.completed ?? stateProgress;
            return completed >= parsedQuestions.length;
          });
          
          // If all other students are done, stop simulation
          if (allOtherStudentsCompleted) {
            // Ensure all students are marked as completed in state
            const finalUsers = prevUsers.map(user => {
              if (user.fullName === 'Alice Anderson') return user;
              const refProgress = studentProgressRef.current[user.fullName];
              const stateProgress = user.completed || 0;
              const completed = refProgress?.completed ?? stateProgress;
              if (completed >= parsedQuestions.length) {
                return {
                  ...user,
                  completed: parsedQuestions.length,
                  isCompleted: true
                };
              }
              return user;
            });
            return finalUsers;
          }

          // Randomly select 1-2 students to make progress (more activity)
          const numStudentsToUpdate = Math.random() < 0.3 ? 2 : 1; // 30% chance of 2 students updating
          const studentsToUpdate = [];
          
          // Get students who haven't completed all questions
          const availableStudents = otherStudents.filter(student => {
            const refProgress = studentProgressRef.current[student.fullName];
            const stateProgress = student.completed || 0;
            const completed = refProgress?.completed || stateProgress;
            return completed < parsedQuestions.length;
          });
          
          if (availableStudents.length === 0) {
            return prevUsers;
          }
          
          // Select random students to update
          for (let i = 0; i < numStudentsToUpdate && i < availableStudents.length; i++) {
            const remainingStudents = availableStudents.filter(
              s => !studentsToUpdate.includes(s)
            );
            if (remainingStudents.length > 0) {
              studentsToUpdate.push(
                remainingStudents[Math.floor(Math.random() * remainingStudents.length)]
              );
            }
          }

          // Update each selected student
          let hasUpdates = false;
          const updatedUsers = prevUsers.map(user => {
            const studentToUpdate = studentsToUpdate.find(s => s.fullName === user.fullName);
            if (!studentToUpdate) {
              // Ensure non-updated students maintain their completion status
              if (user.fullName !== 'Alice Anderson') {
                const refProgress = studentProgressRef.current[user.fullName];
                const currentCompleted = refProgress?.completed ?? user.completed ?? 0;
                if (currentCompleted >= parsedQuestions.length) {
                  return {
                    ...user,
                    completed: parsedQuestions.length,
                    isCompleted: true
                  };
                }
              }
              return user;
            }

            const progress = studentProgressRef.current[studentToUpdate.fullName] || {
              completed: user.completed || 0,
              correct: user.correct || 0,
              totalQuestions: parsedQuestions.length
            };

            // Continue simulating until student completes all questions
            if (progress.completed >= parsedQuestions.length) {
              // Ensure completion is reflected in state
              return {
                ...user,
                completed: parsedQuestions.length,
                isCompleted: true
              };
            }

            // Simulate answering a question (70% chance of correct answer)
            const isCorrect = Math.random() < 0.7;
            progress.completed += 1;
            if (isCorrect) {
              progress.correct += 1;
            }

            studentProgressRef.current[studentToUpdate.fullName] = progress;
            hasUpdates = true;

            return {
              ...user,
              completed: progress.completed,
              correct: progress.correct,
              totalQuestions: parsedQuestions.length,
              // Mark as completed if all questions are done
              isCompleted: progress.completed >= parsedQuestions.length
            };
          });

          // Always schedule next update if there are still students who haven't completed
          const stillIncomplete = updatedUsers.some(user => 
            user.fullName !== 'Alice Anderson' && 
            (user.completed || 0) < parsedQuestions.length
          );
          
          if (stillIncomplete) {
            scheduleNextUpdate();
          }
          
          return updatedUsers;
        });
      }, delay);
    };

    // Start the simulation
    scheduleNextUpdate();

    // Cleanup on unmount or when competition stops
    return () => {
      if (simulationIntervalRef.current) {
        clearTimeout(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    };
  }, [isCompetitionRunning, parsedQuestions.length]);

  const handleAddTime = (minutes) => {
    const additionalSeconds = minutes * 60;
    setTimeRemaining(prev => {
      if (prev === null) return null;
      const newTime = prev + additionalSeconds;
      const maxSeconds = 60 * 60; // Cap at 60 minutes
      return Math.min(newTime, maxSeconds);
    });
    setCompetitionDuration(prev => Math.min(prev + minutes, 60)); // Cap at 60 minutes
  };

  // Countdown timer effect - runs continuously during competition
  useEffect(() => {
    if (!isCompetitionRunning || timeRemaining === null) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    // Only start timer if not already running
    if (timerIntervalRef.current) {
      return;
    }

    // Start countdown
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          return prev === null ? null : 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isCompetitionRunning]); // Only depend on isCompetitionRunning, not timeRemaining

  // Format time as MM:SS
  const formatTime = (seconds) => {
    if (seconds === null) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStudentAnswerUpdate = (studentName, answers, questions) => {
    // Calculate progress in real-time as student answers questions
    let completedCount = 0;
    let correctCount = 0;
    
    questions.forEach(question => {
      const studentAnswer = answers[question.id];
      if (studentAnswer && studentAnswer.trim() !== '') {
        completedCount++;
        
        // Check if answer is correct
        const normalizedStudentAnswer = studentAnswer.trim().toLowerCase();
        const normalizedCorrectAnswer = question.correctAnswer.trim().toLowerCase();
        
        let isCorrect = false;
        if (normalizedStudentAnswer === normalizedCorrectAnswer) {
          isCorrect = true;
        } else if (question.type === 'free-text') {
          // Try numeric comparison for free-text answers
          const studentNum = parseFloat(normalizedStudentAnswer);
          const correctNum = parseFloat(normalizedCorrectAnswer);
          if (!isNaN(studentNum) && !isNaN(correctNum) && Math.abs(studentNum - correctNum) < 0.01) {
            isCorrect = true;
          }
        }
        
        if (isCorrect) {
          correctCount++;
        }
      }
    });
    
    // Update competition user data with current progress
    setCompetitionUsers(prevUsers => {
      return prevUsers.map(user => {
        if (user.fullName === studentName) {
          return {
            ...user,
            completed: completedCount,
            correct: correctCount,
            totalQuestions: questions.length
          };
        }
        return user;
      });
    });
  };

  const handleStudentAnswersSubmit = ({ studentName, completed, correct, totalQuestions }) => {
    // Update competition user data with submitted answers
    setCompetitionUsers(prevUsers => {
      return prevUsers.map(user => {
        if (user.fullName === studentName) {
          return {
            ...user,
            completed,
            correct,
            totalQuestions,
            isCompleted: true
          };
        }
        return user;
      });
    });
    
    // Don't close modal here - let the user see the "Answers Submitted!" screen
    // Modal will close when they click "Done" button
  };


  const breakoutRoomsContent = () => showBreakoutPanel && currentView === 'teacher' ? (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-800">
          Learning Competition
        </h2>
        <button
          onClick={() => setShowBreakoutPanel(false)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Close panel"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {!isCompetitionRunning ? (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* Questions Input */}
          <div className="flex flex-col gap-2">
            <label htmlFor="questions" className="text-sm font-medium text-gray-700">
              Questions
            </label>
            <textarea
              id="questions"
              value={competitionQuestions}
              onPaste={(e) => {
                e.preventDefault();
                // Auto-generate questions when pasting
                const questions = generateGrade6MathQuestions();
                const questionsText = JSON.stringify(questions, null, 2);
                setCompetitionQuestions(questionsText);
                setParsedQuestions(questions);
              }}
              onChange={(e) => {
                setCompetitionQuestions(e.target.value);
                // Try to parse questions if they're in JSON format
                try {
                  const parsed = JSON.parse(e.target.value);
                  if (Array.isArray(parsed)) {
                    setParsedQuestions(parsed);
                  }
                } catch (err) {
                  // Not valid JSON, keep existing parsed questions
                }
              }}
              placeholder="Paste your questions here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              rows={8}
            />
          </div>

          {/* Duration Input */}
          <div className="flex flex-col gap-2">
            <label htmlFor="duration" className="text-sm font-medium text-gray-700">
              Duration (minutes)
            </label>
            <input
              id="duration"
              type="number"
              min="1"
              max="60"
              value={competitionDuration}
              onChange={(e) => setCompetitionDuration(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartCompetition}
            disabled={!competitionQuestions.trim()}
            className="w-full px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Competition
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Header with End Button */}
          {showEndConfirmation ? (
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-gray-800">
                  Would you like to share the results with the rest of the class?
                </p>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleConfirmEnd(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors w-full"
                  >
                    Share Results
                  </button>
                  <button
                    onClick={() => handleConfirmEnd(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors w-full"
                  >
                    End Without Sharing
                  </button>
                  <button
                    onClick={handleCancelEnd}
                    className="px-4 py-2 bg-transparent border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors w-full"
                  >
                    Cancel
                  </button>
                </div>
                
                {/* Ranked Student List */}
                <div className="bg-white rounded-lg p-3 max-h-64 overflow-y-auto">
                  <div className="text-xs uppercase mb-2 font-semibold text-gray-700">
                    LEARNING COMPETITION RESULTS
                  </div>
                  <div className="space-y-1">
                    {getRankedStudents().map((user, index) => {
                      const rank = index + 1;
                      const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "";
                      return (
                        <div key={user.fullName} className="flex items-center justify-between text-sm py-1">
                          <div className="flex items-center gap-2">
                            {medal && <span>{medal}</span>}
                            {!medal && <span className="text-gray-500 text-xs">{rank}.</span>}
                            <span className="text-gray-800">{user.fullName}</span>
                          </div>
                          <span className="text-gray-600 font-medium ml-auto">{user.correct}/{user.completed}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={`text-base font-medium ${timeRemaining !== null && timeRemaining <= 60 ? 'text-red-600' : 'text-gray-700'}`}>
                    {timeRemaining !== null ? formatTime(timeRemaining) : `${competitionDuration} minutes`}
                  </span>
                  <button
                    onClick={handleEndCompetition}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                    </svg>
                    End
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAddTime(1)}
                    disabled={competitionDuration >= 60}
                    className="px-1.5 py-0.5 bg-white border border-gray-300 text-[10px] font-medium text-gray-700 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Add 1 minute"
                  >
                    +1 min
                  </button>
                  <button
                    onClick={() => handleAddTime(5)}
                    disabled={competitionDuration >= 60}
                    className="px-1.5 py-0.5 bg-white border border-gray-300 text-[10px] font-medium text-gray-700 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Add 5 minutes"
                  >
                    +5 min
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard - Only show when not showing confirmation dialog */}
          {!showEndConfirmation && competitionUsers.length > 0 && (
            <CompetitionLeaderboard users={competitionUsers} />
          )}
          {!showEndConfirmation && competitionUsers.length === 0 && (
            <div className="flex items-center justify-center text-sm text-gray-500 py-8">
              No participants yet
            </div>
          )}
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
    {/* Competition Modal for Student View - Alice Anderson */}
    {currentView === 'student' && isCompetitionRunning && parsedQuestions.length > 0 && showCompetitionModal && (
      <CompetitionModal
        isOpen={showCompetitionModal}
        questions={parsedQuestions}
        duration={competitionDuration}
        timeRemaining={timeRemaining}
        onBackdropClick={() => {
          // Allow closing modal (Done button uses this)
          setShowCompetitionModal(false);
        }}
        onClose={() => {
          // Also handle onClose for Done button
          setShowCompetitionModal(false);
        }}
        studentName="Alice Anderson"
        onSubmitAnswers={handleStudentAnswersSubmit}
        currentQuestionIndex={studentCurrentQuestionIndex}
        onQuestionIndexChange={setStudentCurrentQuestionIndex}
        answers={studentAnswers}
        onAnswersChange={(newAnswers) => {
          setStudentAnswers(newAnswers);
          // Update leaderboard in real-time as answers change
          handleStudentAnswerUpdate("Alice Anderson", newAnswers, parsedQuestions);
        }}
      />
    )}
    <Layout 
      breakoutRoomsContent={breakoutRoomsContent}
      showBreakoutPanel={showBreakoutPanel && currentView === 'teacher'}
      currentView={currentView}
      onToggleView={() => {
        const newView = currentView === 'teacher' ? 'student' : 'teacher';
        setCurrentView(newView);
        // Set initial panel state when switching to student view
        if (newView === 'student') {
          // Start with chat panel open, close other panels
          setShowChatPanel(true);
          setShowUsersPanel(false);
          setShowBreakoutPanel(false);
          // Show modal when switching back to student view during active competition
          // But only if Alice hasn't already submitted
          if (isCompetitionRunning && parsedQuestions.length > 0) {
            const aliceUser = competitionUsers.find(user => user.fullName === 'Alice Anderson');
            const aliceHasSubmitted = aliceUser && aliceUser.isCompleted === true;
            if (!aliceHasSubmitted) {
              setShowCompetitionModal(true);
            } else {
              setShowCompetitionModal(false);
            }
          }
        }
        // When switching to teacher view during active competition, only show Learning Competition panel
        if (newView === 'teacher' && isCompetitionRunning) {
          setShowBreakoutPanel(true);
          setShowUsersPanel(false);
          setShowChatPanel(false);
        }
      }}
      onToggleBreakoutPanel={() => {
        const newValue = !showBreakoutPanel;
        setShowBreakoutPanel(newValue);
        if (newValue) {
          // When opening learning competition, close other panels
          setShowUsersPanel(false);
          setShowChatPanel(false);
        }
      }}
      usersContent={usersContent}
      showUsersPanel={showUsersPanel}
      onToggleUsersPanel={() => {
        const newValue = !showUsersPanel;
        setShowUsersPanel(newValue);
        if (newValue) {
          // When opening users, close other panels
          setShowBreakoutPanel(false);
          if (currentView === 'student') {
            // In student view, close chat when opening users
            setShowChatPanel(false);
          } else {
            setShowChatPanel(false);
          }
        }
      }}
      chatContent={chatContent}
      showChatPanel={showChatPanel}
      onToggleChatPanel={() => {
        if (currentView === 'student') {
          // In student view, allow toggling chat panel
          const newValue = !showChatPanel;
          setShowChatPanel(newValue);
          if (newValue) {
            // When opening chat, close other panels
            setShowBreakoutPanel(false);
            setShowUsersPanel(false);
          }
        } else {
          const newValue = !showChatPanel;
          setShowChatPanel(newValue);
          if (newValue) {
            // When opening chat, close other panels
            setShowBreakoutPanel(false);
            setShowUsersPanel(false);
          }
        }
      }}
      selectedRoom={selectedRoom}
      onLeaveBreakoutRoom={() => {
        // Remove teacher from the current room
        setTeacherRoomId(null);
        // Deselect the room
        setSelectedRoomId(null);
        // Reset active tab when leaving room
        setActiveTab('presentation');
      }}
      isScreenshareEnabled={selectedRoomId ? (roomScreenshare[selectedRoomId] || false) : false}
      setIsScreenshareEnabled={(enabled) => {
        if (selectedRoomId) {
          setRoomScreenshare(prev => ({
            ...prev,
            [selectedRoomId]: enabled
          }));
          // If enabling screenshare while in a room, switch to screenshare tab
          if (enabled) {
            setActiveTab('screenshare');
          } else if (activeTab === 'screenshare') {
            // If disabling screenshare and we're on screenshare tab, switch to presentation
            setActiveTab('presentation');
          }
        }
      }}
    >
      <div className={`h-full flex justify-center w-full min-h-0 min-w-0 ${selectedRoom ? 'overflow-hidden items-start' : 'overflow-hidden items-center'}`}>
        {selectedRoom ? (
          <RoomDetails 
            room={selectedRoom} 
            teacher={teacher} 
            activeTab={activeTab} 
            onTabChange={(tab) => {
              const currentRoomScreenshare = selectedRoomId ? (roomScreenshare[selectedRoomId] || false) : false;
              // If screenshare is disabled and user tries to switch to screenshare, switch to presentation instead
              if (tab === 'screenshare' && !currentRoomScreenshare) {
                setActiveTab('presentation');
              } else {
                setActiveTab(tab);
              }
            }}
            isScreenshareEnabled={selectedRoomId ? (roomScreenshare[selectedRoomId] || false) : false}
            sharedNotes={roomNotes[selectedRoomId] || ''}
            onSharedNotesChange={(notes) => {
              setRoomNotes(prev => ({
                ...prev,
                [selectedRoomId]: notes
              }));
            }}
            teacherRoomId={teacherRoomId}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center min-h-0">
            <ParticipantsGrid users={getAllUsers()} teacher={null} />
            <div className="flex-1 min-h-0 w-full">
              <Presentation title="Presentation" />
            </div>
      </div>
        )}
      </div>
    </Layout>
    </>
  );
}

export default App;
