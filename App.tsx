
import React, { useState, useEffect, useCallback } from 'react';
import type { Feature, ChatHistory, ChatSession } from './types';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import ImageEditor from './components/ImageEditor';
import VideoAnalyzer from './components/VideoAnalyzer';
import TextProcessor from './components/TextProcessor';
import AudioTranscriber from './components/AudioTranscriber';
import Auth from './components/Auth';
import { NotebookIcon, MenuIcon } from './components/common/Icons';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [activeFeature, setActiveFeature] = useState<Feature>('chat');
  const [chatHistory, setChatHistory] = useState<ChatHistory>({});
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const user = sessionStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(user);
      const history = localStorage.getItem(`chatHistory_${user}`);
      if (history) {
        setChatHistory(JSON.parse(history));
      }
    }
  }, []);

  const handleLogin = (username: string) => {
    sessionStorage.setItem('currentUser', username);
    setCurrentUser(username);
    const history = localStorage.getItem(`chatHistory_${username}`);
    setChatHistory(history ? JSON.parse(history) : {});
    setActiveSessionId(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('currentUser');
    setCurrentUser(null);
    setChatHistory({});
    setActiveSessionId(null);
  };

  const handleChatUpdate = useCallback((sessionId: string, session: ChatSession) => {
    const updatedHistory = { ...chatHistory, [sessionId]: session };
    setChatHistory(updatedHistory);
    if (currentUser) {
      localStorage.setItem(`chatHistory_${currentUser}`, JSON.stringify(updatedHistory));
    }
  }, [chatHistory, currentUser]);

  const handleNewChat = () => {
    setActiveSessionId(null);
  };
  
  const handleDeleteChat = (sessionId: string) => {
    const updatedHistory = { ...chatHistory };
    delete updatedHistory[sessionId];
    setChatHistory(updatedHistory);
    if (currentUser) {
      localStorage.setItem(`chatHistory_${currentUser}`, JSON.stringify(updatedHistory));
    }
    if (activeSessionId === sessionId) {
        setActiveSessionId(null);
    }
  };

  if (!currentUser) {
    return <Auth onLoginSuccess={handleLogin} />;
  }

  const renderFeature = () => {
    switch (activeFeature) {
      case 'chat':
        return (
          <Chat
            key={activeSessionId || 'new'}
            sessionId={activeSessionId}
            session={activeSessionId ? chatHistory[activeSessionId] : null}
            onUpdate={handleChatUpdate}
            onNewSessionCreated={setActiveSessionId}
          />
        );
      case 'image':
        return <ImageEditor />;
      case 'video':
        return <VideoAnalyzer />;
      case 'text':
        return <TextProcessor />;
      case 'audio':
        return <AudioTranscriber />;
      default:
        return <Chat key="new" sessionId={null} session={null} onUpdate={handleChatUpdate} onNewSessionCreated={setActiveSessionId} />;
    }
  };

  return (
    <div className="relative min-h-screen md:flex bg-slate-900 font-sans">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeFeature={activeFeature}
        setActiveFeature={setActiveFeature}
        onLogout={handleLogout}
        chatHistory={chatHistory}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
      />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center">
             <button
              className="p-1 mr-3 text-slate-300 hover:text-white md:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <NotebookIcon className="w-8 h-8 text-cyan-400 mr-3 hidden sm:block" />
            <h1 className="text-xl font-bold text-slate-200">Notebook LM Studio</h1>
          </div>
          <div className="text-sm text-slate-400">
            Welcome, <span className="font-semibold text-slate-200">{currentUser?.split('@')[0]}</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-900">
          {renderFeature()}
        </div>
      </main>
    </div>
  );
};

export default App;
