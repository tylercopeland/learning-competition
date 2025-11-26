import React, { useState, useRef } from 'react';
import MeetingControls from './MeetingControls';

export default function Layout({ children, breakoutRoomsContent, showBreakoutPanel, onToggleBreakoutPanel, usersContent, showUsersPanel, onToggleUsersPanel, chatContent, showChatPanel, onToggleChatPanel, selectedRoom, onLeaveBreakoutRoom, isScreenshareEnabled, setIsScreenshareEnabled }) {
  const [breakoutPanelWidth, setBreakoutPanelWidth] = useState(320); // 80 * 4 = 320px (w-80)
  const [usersPanelWidth, setUsersPanelWidth] = useState(320);
  
  const isResizingBreakout = useRef(false);
  const isResizingUsers = useRef(false);
  const breakoutResizeStartX = useRef(0);
  const breakoutResizeStartWidth = useRef(0);
  const usersResizeStartX = useRef(0);
  const usersResizeStartWidth = useRef(0);

  const handleMouseMove = (e) => {
    if (isResizingBreakout.current) {
      const deltaX = e.clientX - breakoutResizeStartX.current;
      const newWidth = breakoutResizeStartWidth.current + deltaX;
      if (newWidth >= 250 && newWidth <= 600) {
        setBreakoutPanelWidth(newWidth);
      }
    }
    if (isResizingUsers.current) {
      const deltaX = e.clientX - usersResizeStartX.current;
      const newWidth = usersResizeStartWidth.current + deltaX;
      if (newWidth >= 250 && newWidth <= 600) {
        setUsersPanelWidth(newWidth);
      }
    }
  };

  const handleMouseUp = () => {
    isResizingBreakout.current = false;
    isResizingUsers.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleBreakoutResizeStart = (e) => {
    e.preventDefault();
    isResizingBreakout.current = true;
    breakoutResizeStartX.current = e.clientX;
    breakoutResizeStartWidth.current = breakoutPanelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleUsersResizeStart = (e) => {
    e.preventDefault();
    isResizingUsers.current = true;
    usersResizeStartX.current = e.clientX;
    usersResizeStartWidth.current = usersPanelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const isAnyPanelOpen = showBreakoutPanel || showUsersPanel || showChatPanel;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <aside 
        className="bg-white border-r border-gray-200 flex flex-col items-center py-4 flex-shrink-0 h-full w-16"
      >
        {/* Logo Placeholder */}
        <div className="w-8 h-8 mb-2 bg-gray-200 rounded flex items-center justify-center">
          <span className="text-sm font-bold text-gray-600">B</span>
        </div>
        
        {/* Profile Icon */}
        <div className="relative group mb-3">
          <button className="p-2 hover:bg-gray-100 rounded transition-colors">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            Profile
          </div>
        </div>
        
        <div className="flex flex-col items-center space-y-3 flex-1">
          {/* Users Icon */}
          <div className="relative group">
            <button 
              onClick={onToggleUsersPanel}
              className={`p-2 rounded transition-colors ${
                showUsersPanel 
                  ? 'bg-blue-100 hover:bg-blue-200' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <svg 
                className={`w-6 h-6 ${
                  showUsersPanel 
                    ? 'text-blue-600' 
                    : 'text-gray-600'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              Users
            </div>
          </div>
          
          {/* Chat Icon */}
          <div className="relative group">
            <button
              onClick={onToggleChatPanel}
              className={`p-2 rounded transition-colors ${
                showChatPanel
                  ? 'bg-blue-100 hover:bg-blue-200'
                  : 'hover:bg-gray-100'
              }`}
            >
              <svg
                className={`w-6 h-6 ${
                  showChatPanel
                    ? 'text-blue-600'
                    : 'text-gray-600'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              Chat
            </div>
          </div>
          
          {/* Notes Icon */}
          <div className="relative group">
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              Share Notes
            </div>
          </div>
          
          {/* Plugins Icon */}
          <div className="relative group">
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </button>
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              Plugins
            </div>
          </div>
          
          {/* Learning Competition Icon */}
          <div className="relative group">
            <button 
              className={`p-2 rounded transition-colors ${
                showBreakoutPanel 
                  ? 'bg-blue-100 hover:bg-blue-200' 
                  : 'hover:bg-gray-100'
              }`} 
              onClick={onToggleBreakoutPanel}
            >
              <svg 
                className={`w-6 h-6 ${
                  showBreakoutPanel 
                    ? 'text-blue-600' 
                    : 'text-gray-600'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </button>
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              Learning Competition
            </div>
          </div>
        </div>
        
        {/* Analytics Icon - Above Settings */}
        <div className="relative group mt-auto mb-1">
          <button className="p-2 hover:bg-gray-100 rounded transition-colors">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            Learning Analytics Dashboard
          </div>
        </div>
        
        {/* Settings Icon - Bottom Left */}
        <div className="relative group">
          <button className="p-2 hover:bg-gray-100 rounded transition-colors">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            Settings
          </div>
        </div>
      </aside>

      {/* Chat Panel */}
      {showChatPanel && chatContent && (
        <>
          {/* Chat Panel */}
          <aside
            className="bg-white border-r border-gray-200 flex flex-col flex-shrink-0"
            style={{ width: '320px' }}
          >
            <div className="flex-1 overflow-auto p-6">
              {typeof chatContent === 'function' ? chatContent(320) : chatContent}
            </div>
          </aside>
        </>
      )}

      {/* Users Panel */}
      {showUsersPanel && usersContent && (
        <>

          {/* Users Panel */}
          <aside 
            className="bg-white border-r border-gray-200 flex flex-col flex-shrink-0"
            style={{ width: `${usersPanelWidth}px` }}
          >
            <div className="flex-1 overflow-auto p-6">
              {typeof usersContent === 'function' ? usersContent(usersPanelWidth) : usersContent}
            </div>
          </aside>

          {/* Users Panel Resize Handle */}
          <div
            onMouseDown={handleUsersResizeStart}
            className="w-0.5 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex-shrink-0 transition-colors"
          />
        </>
      )}

      {/* Learning Competition Panel */}
      {showBreakoutPanel && breakoutRoomsContent && (
        <>
          {/* Learning Competition Panel */}
          <aside 
            className="bg-white border-r border-gray-200 flex flex-col flex-shrink-0"
            style={{ width: `${breakoutPanelWidth}px` }}
          >
            <div className="flex-1 overflow-auto p-6">
              {typeof breakoutRoomsContent === 'function' ? breakoutRoomsContent() : breakoutRoomsContent}
            </div>
          </aside>

          {/* Learning Competition Panel Resize Handle */}
          <div
            onMouseDown={handleBreakoutResizeStart}
            className="w-0.5 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex-shrink-0 transition-colors"
          />
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Toolbar */}
            <header className={`h-16 flex items-center justify-between flex-shrink-0 relative ${(showBreakoutPanel || showUsersPanel) ? 'px-6' : 'pl-6 pr-6'}`}>
              <div className="text-sm font-medium text-gray-700">
                {selectedRoom ? selectedRoom.name : 'Main Session'}
              </div>
              
              {/* Top Right Controls */}
              <div className="flex items-center gap-3">
                {selectedRoom ? (
                  /* Leave Button - Outline when in room */
                  <button
                    onClick={onLeaveBreakoutRoom}
                    className="px-4 py-2 bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    Leave
                  </button>
                ) : (
                  <>
                    {/* Start Recording Button */}
                    <button className="flex items-center gap-2 px-4 py-2 bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="4" fill="currentColor"/>
                      </svg>
                      <span>Start Recording</span>
                    </button>
                    
                    {/* Signal/Activity Indicator */}
                    <div className="w-10 h-10 bg-transparent border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="4" y="12" width="2" height="4" rx="1"/>
                        <rect x="8" y="10" width="2" height="6" rx="1"/>
                        <rect x="12" y="8" width="2" height="8" rx="1"/>
                      </svg>
                    </div>
                    
                    {/* Leave Meeting Button */}
                    <button 
                      className="w-10 h-10 bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors flex items-center justify-center"
                      title="Leave Meeting"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
        </header>

        {/* Center Content Area */}
        <main className={`flex-1 ${isAnyPanelOpen ? 'overflow-auto p-6' : 'overflow-hidden pt-6 pr-6 pb-6 pl-0'}`}>
          {children}
        </main>

            {/* Meeting Controls */}
            <div className="flex-shrink-0">
              <MeetingControls isScreenshareEnabled={isScreenshareEnabled} onScreenshareToggle={setIsScreenshareEnabled} />
            </div>
      </div>
    </div>
  );
}

