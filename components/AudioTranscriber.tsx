
import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from "@google/genai";
import { MicIcon, StopCircleIcon } from './common/Icons';

const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error("API_KEY environment variable not set");

// Base64 encoding function
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}


const AudioTranscriber: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [error, setError] = useState<string | null>(null);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    const stopRecording = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setIsRecording(false);
    }, []);

    const startRecording = async () => {
        setIsRecording(true);
        setError(null);
        setTranscription('');
        let currentInputTranscription = '';
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const ai = new GoogleGenAI({ apiKey: API_KEY });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        console.log('Live session opened.');
                        mediaStreamSourceRef.current = audioContextRef.current!.createMediaStreamSource(stream);
                        scriptProcessorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);

                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current!.destination);
                    },
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            currentInputTranscription += text;
                            setTranscription(currentInputTranscription);
                        }
                        if (message.serverContent?.turnComplete) {
                            currentInputTranscription += '\n';
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setError('An error occurred during transcription.');
                        stopRecording();
                    },
                    onclose: (e: CloseEvent) => {
                        console.log('Live session closed.');
                        stopRecording();
                    },
                },
                config: {
                    inputAudioTranscription: {},
                }
            });

        } catch (err) {
            console.error('Error starting recording:', err);
            setError('Could not access microphone. Please check permissions.');
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-slate-200 mb-4">Real-time Audio Transcription</h2>
            <p className="text-slate-400 mb-6">Click the button and start speaking. Your words will be transcribed live using the Gemini Live API.</p>
            
            <button
                onClick={toggleRecording}
                className={`px-8 py-4 rounded-full text-white font-semibold text-lg transition-all duration-300 flex items-center justify-center mx-auto mb-6 ${
                    isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-600 hover:bg-cyan-700'
                } shadow-lg focus:outline-none focus:ring-4 ${isRecording ? 'focus:ring-red-400' : 'focus:ring-cyan-400'}`}
            >
                {isRecording ? (
                    <>
                        <StopCircleIcon className="w-6 h-6 mr-3"/>
                        Stop Recording
                    </>
                ) : (
                     <>
                        <MicIcon className="w-6 h-6 mr-3"/>
                        Start Recording
                    </>
                )}
            </button>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            
            <div className="w-full min-h-[200px] p-4 bg-slate-800 rounded-lg border border-slate-700 text-left">
                <p className="text-slate-200 whitespace-pre-wrap">{transcription || <span className="text-slate-500">Transcription will appear here...</span>}</p>
            </div>
        </div>
    );
};

export default AudioTranscriber;
