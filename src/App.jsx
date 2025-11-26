import React, { useState } from 'react';
import Layout from './components/Layout';
import Presentation from './components/Presentation';
import RoomDetails from './components/RoomDetails';
import ParticipantsGrid from './components/ParticipantsGrid';

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
        <button
          onClick={() => setShowChatPanel(false)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Close panel"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Messages Area - Placeholder for now */}
      <div className="flex-1 overflow-y-auto mb-4">
        <div className="text-sm text-gray-500 text-center mt-8">
          No messages yet
        </div>
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

  const breakoutRoomsContent = () => showBreakoutPanel ? (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
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
    </div>
  ) : null;

  return (
    <>
    <Layout 
      breakoutRoomsContent={breakoutRoomsContent}
      showBreakoutPanel={showBreakoutPanel}
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
          setShowChatPanel(false);
        }
      }}
      chatContent={chatContent}
      showChatPanel={showChatPanel}
      onToggleChatPanel={() => {
        const newValue = !showChatPanel;
        setShowChatPanel(newValue);
        if (newValue) {
          // When opening chat, close other panels
          setShowBreakoutPanel(false);
          setShowUsersPanel(false);
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
