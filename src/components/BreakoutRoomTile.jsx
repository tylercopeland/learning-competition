import React, { useState } from 'react';
import DraggableAvatar from './DraggableAvatar';
import TeacherAvatar from './TeacherAvatar';

export default function BreakoutRoomTile({ 
  roomId,
  roomName, 
  participants = [], 
  onDrop,
  onUserRemove,
  onClick,
  isSelected,
  teacher,
  showTeacher,
  isDraggingOver,
  activeTab = 'presentation',
  hasActivity = true,
  sharedNotes = null
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const userName = e.dataTransfer.getData('text/plain');
    if (onDrop) {
      onDrop(userName);
    }
  };

  const handleClick = (e) => {
    // Don't trigger click if clicking directly on draggable avatars
    // But allow clicks on the card itself even if avatars are present
    if (e.target.closest('[draggable="true"]') && e.target.closest('[draggable="true"]') === e.target) {
      return;
    }
    if (onClick) {
      onClick();
    }
  };

  const showDropZone = isDragOver || isDraggingOver;

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        bg-white border-2 rounded-lg p-4 w-full
        transition-all cursor-pointer min-w-0
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : showDropZone 
            ? 'border-blue-400 bg-blue-50 shadow-md' 
            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
      `}
    >
      {/* Room Name */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-700 truncate">
            {roomName.replace('Room ', '')}
          </h3>
          {/* Activity Graph Line */}
          <div className="flex-shrink-0 relative group">
            {hasActivity ? (
              <svg className="w-6 h-6 text-green-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h3l2-4h2l2 4" />
                <circle cx="18" cy="8" r="1.5" fill="currentColor" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
              </svg>
            )}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {hasActivity ? 'Active competition' : 'No activity'}
            </div>
          </div>
        </div>
        {isSelected && (
          <svg className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>

      {/* Thumbnail - Updates based on active tab */}
      <div className={`mb-3 w-full aspect-video rounded overflow-hidden flex items-center justify-center ${
        activeTab === 'shared-notes' 
          ? 'bg-white border border-gray-300' 
          : 'bg-gray-100 border border-gray-200'
      }`}>
        <div className={`${activeTab === 'shared-notes' ? 'w-full h-full' : 'text-center text-gray-400'}`}>
          {activeTab === 'screenshare' ? (
            <>
              <svg 
                className="w-12 h-12 mx-auto mb-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                />
              </svg>
              <p className="text-xs">Screenshare</p>
            </>
          ) : activeTab === 'shared-notes' ? (
            <>
              {sharedNotes ? (
                <div className="w-full h-full p-3 overflow-hidden">
                  <p className="text-xs text-gray-700 text-left whitespace-pre-wrap break-words" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {sharedNotes}
                  </p>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-xs text-gray-400">No notes</p>
                </div>
              )}
            </>
          ) : (
            <>
              <svg 
                className="w-12 h-12 mx-auto mb-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <p className="text-xs">Presentation</p>
            </>
          )}
        </div>
      </div>

      {/* Participants */}
      {(participants.length > 0 || (showTeacher && teacher)) ? (
        <div className="flex flex-wrap gap-2">
          {/* Teacher avatar - always first */}
          {showTeacher && teacher && (
            <TeacherAvatar 
              userName={teacher.fullName} 
              userInitial={teacher.initials}
            />
          )}
          {/* Student participants */}
          {participants.map((participant, index) => {
            const fullName = typeof participant === 'string' ? participant : participant.fullName || participant.name;
            const initials = typeof participant === 'object' && participant.initials 
              ? participant.initials 
              : null;
            
            return (
              <DraggableAvatar 
                key={index}
                userName={fullName} 
                userInitial={initials}
                size="sm"
              />
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-500 text-center">No participants</p>
      )}

      {/* Drop Zone Indicator */}
      {showDropZone && (
        <div className="mt-3 pt-3 border-t border-blue-300">
          <div className="text-xs text-blue-600 font-medium text-center">
            Drop here to join
          </div>
        </div>
      )}
    </div>
  );
}

