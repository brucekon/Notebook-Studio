
import React from 'react';
import type { Feature, ChatHistory, ChatSession } from '../types';
import { ChatIcon, ImageIcon, VideoIcon, TextIcon, MicIcon, PlusIcon, LogoutIcon, TrashIcon, XIcon } from './common/Icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeFeature: Feature;
  setActiveFeature: (feature: Feature) => void;
  onLogout: () => void;
  chatHistory: ChatHistory;
  activeSessionId: string | null;
  setActiveSessionId: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    isOpen,
    onClose,
    activeFeature, 
    setActiveFeature, 
    onLogout, 
    chatHistory,
    activeSessionId,
    setActiveSessionId,
    onNewChat,
    onDeleteChat
}) => {
  const navItems: { id: Feature; name: string; icon: React.ReactNode }[] = [
    { id: 'chat', name: 'Chat Assistant', icon: <ChatIcon className="w-6 h-6" /> },
    { id: 'image', name: 'Image Editor', icon: <ImageIcon className="w-6 h-6" /> },
    { id: 'video', name: 'Video Analyzer', icon: <VideoIcon className="w-6 h-6" /> },
    { id: 'text', name: 'Text Processor', icon: <TextIcon className="w-6 h-6" /> },
    { id: 'audio', name: 'Audio Transcriber', icon: <MicIcon className="w-6 h-6" /> },
  ];
  
  const sortedHistory = Object.entries(chatHistory).sort(([a], [b]) => Number(b) - Number(a));

  return (
    <nav className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-800 p-4 flex flex-col border-r border-slate-700 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">Features</h2>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white md:hidden" aria-label="Close sidebar">
          <XIcon className="w-6 h-6" />
        </button>
      </div>
      <ul className="space-y-2">
        {navItems.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => { setActiveFeature(item.id); onClose(); }}
              className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 ${
                activeFeature === item.id
                  ? 'bg-cyan-500 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="ml-4 font-medium">{item.name}</span>
            </button>
          </li>
        ))}
      </ul>

      {activeFeature === 'chat' && (
        <div className="mt-8 flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-white">Chat History</h3>
            <button onClick={() => { onNewChat(); onClose(); }} className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-1">
             {sortedHistory.length === 0 ? (
                <p className="text-sm text-slate-500 px-2 py-1">No chats yet.</p>
             ) : (
                sortedHistory.map(([id, session]) => (
                    <div key={id} className="group flex items-center">
                        <button
                            onClick={() => { setActiveSessionId(id); onClose(); }}
                            className={`w-full text-left p-2 rounded-md truncate text-sm transition-colors ${
                                activeSessionId === id 
                                ? 'bg-slate-700 text-white' 
                                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                            }`}
                        >
                            {(session as ChatSession).title || 'New Chat'}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteChat(id); }} 
                            className="ml-1 p-1 rounded-md text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-opacity"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))
             )}
          </div>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-slate-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center p-3 rounded-lg transition-colors duration-200 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <LogoutIcon className="w-6 h-6" />
          <span className="ml-4 font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
