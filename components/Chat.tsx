
import React, { useState, useRef, useEffect } from 'react';
import { Chat as GenAIChat } from "@google/genai";
import { ChatRole } from '../types';
import type { ChatMessage, GroundingSource, ChatSession } from '../types';
import { getChat, getGroundedChat } from '../services/geminiService';
import { SendIcon, SearchIcon, BotIcon, UserIcon, SoundOnIcon, StopIcon } from './common/Icons';
import { generateSpeech } from '../services/geminiService';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import LoadingSpinner from './common/LoadingSpinner';

interface ChatProps {
  sessionId: string | null;
  session: ChatSession | null;
  onUpdate: (sessionId: string, session: ChatSession) => void;
  onNewSessionCreated: (sessionId: string) => void;
}

const Chat: React.FC<ChatProps> = ({ sessionId, session, onUpdate, onNewSessionCreated }) => {
    const [messages, setMessages] = useState<ChatMessage[]>(session?.messages || []);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useGrounding, setUseGrounding] = useState(false);
    const [currentTtsText, setCurrentTtsText] = useState<string | null>(null);

    const { playAudio, stopAudio, isPlaying } = useAudioPlayer();

    const chatRef = useRef<GenAIChat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentSessionIdRef = useRef<string | null>(sessionId);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    useEffect(() => {
        chatRef.current = useGrounding ? getGroundedChat() : getChat();
        if (session) {
            // Restore history for the gemini chat instance
            const history = session.messages.flatMap(msg => ({
                role: msg.role,
                parts: [{ text: msg.text }]
            }));
            chatRef.current.setHistory(history.slice(0, -1)); // all but the last one
        }
    }, [useGrounding, session]);
    
    useEffect(() => {
        currentSessionIdRef.current = sessionId;
        setMessages(session?.messages || []);
    }, [sessionId, session]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: ChatRole.USER, text: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            if (!chatRef.current) {
               chatRef.current = useGrounding ? getGroundedChat() : getChat();
            }
            
            const stream = await chatRef.current.sendMessageStream({ message: input });

            let modelResponse: ChatMessage = { role: ChatRole.MODEL, text: '', sources: [] };
            setMessages(prev => [...prev, modelResponse]);

            for await (const chunk of stream) {
                const text = chunk.text;
                const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
                
                const sources: GroundingSource[] = groundingChunks?.map((c: any) => ({
                  uri: c.web.uri,
                  title: c.web.title,
                })) || [];

                setMessages(prev => {
                    const updatedMessages = prev.map((msg, index) => {
                        if (index === prev.length - 1) {
                            modelResponse = { ...msg, text: msg.text + text, sources: sources.length > 0 ? sources : msg.sources };
                            return modelResponse;
                        }
                        return msg;
                    });
                    return updatedMessages;
                });
            }
            
            const finalMessages = [...newMessages, modelResponse];
            let newSessionId = currentSessionIdRef.current;
            if (!newSessionId) {
                newSessionId = Date.now().toString();
                currentSessionIdRef.current = newSessionId;
                onNewSessionCreated(newSessionId);
            }
            const newSession = {
                title: finalMessages[0].text.substring(0, 30),
                messages: finalMessages
            };
            onUpdate(newSessionId, newSession);

        } catch (error) {
            console.error(error);
            const errorMessage: ChatMessage = { role: ChatRole.MODEL, text: "Sorry, I encountered an error. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTts = async (text: string) => {
        if (isPlaying && currentTtsText === text) {
            stopAudio();
            setCurrentTtsText(null);
        } else {
            setCurrentTtsText(text);
            try {
                const audio = await generateSpeech(text);
                playAudio(audio);
            } catch (error) {
                console.error("TTS generation failed:", error);
                setCurrentTtsText(null);
            }
        }
    };
    
    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto">
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-800/50 rounded-lg">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 ${msg.role === ChatRole.USER ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === ChatRole.MODEL && <BotIcon className="w-8 h-8 text-cyan-400 flex-shrink-0" />}
                        <div className={`max-w-xl p-4 rounded-xl shadow-md ${msg.role === ChatRole.USER ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-200'}`}>
                           <p className="whitespace-pre-wrap">{msg.text}</p>
                           {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-4 pt-2 border-t border-slate-600">
                                    <h4 className="text-sm font-semibold text-slate-400 mb-2">Sources:</h4>
                                    <ul className="space-y-1">
                                        {msg.sources.map((source, i) => (
                                            <li key={i}>
                                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline text-xs truncate block">
                                                    {i + 1}. {source.title}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {msg.role === ChatRole.MODEL && msg.text && (
                                <button onClick={() => handleTts(msg.text)} className="mt-3 text-slate-400 hover:text-cyan-400 transition-colors">
                                    {isPlaying && currentTtsText === msg.text ? <StopIcon className="w-5 h-5" /> : <SoundOnIcon className="w-5 h-5" />}
                                </button>
                            )}
                        </div>
                        {msg.role === ChatRole.USER && <UserIcon className="w-8 h-8 text-indigo-400 flex-shrink-0" />}
                    </div>
                ))}
                 {isLoading && messages[messages.length - 1]?.role === ChatRole.USER && (
                    <div className="flex items-start gap-4 justify-start">
                        <BotIcon className="w-8 h-8 text-cyan-400 flex-shrink-0" />
                        <div className="max-w-xl p-4 rounded-xl shadow-md bg-slate-700 text-slate-200">
                           <LoadingSpinner />
                        </div>
                    </div>
                 )}
                <div ref={messagesEndRef} />
            </div>

            <div className="mt-4 p-4 bg-slate-800 rounded-lg shadow-inner">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 relative min-w-[200px]">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask me anything..."
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            disabled={isLoading}
                        />
                    </div>
                     <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="p-3 bg-cyan-500 rounded-lg text-white disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-cyan-600 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                        {isLoading ? <LoadingSpinner /> : <SendIcon className="w-6 h-6" />}
                    </button>
                    <label className="flex items-center cursor-pointer text-slate-300">
                        <input
                            type="checkbox"
                            checked={useGrounding}
                            onChange={() => setUseGrounding(!useGrounding)}
                            className="sr-only peer"
                        />
                         <div className={`w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-cyan-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600`}></div>
                        <span className="ml-3 font-medium flex items-center"><SearchIcon className="w-5 h-5 mr-1" /> Grounding</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default Chat;
