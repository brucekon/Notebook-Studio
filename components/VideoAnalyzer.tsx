
import React, { useState, useRef } from 'react';
import { analyzeVideo } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import { UploadIcon, AnalyzeIcon } from './common/Icons';

const MAX_FRAMES = 10;
const FRAME_INTERVAL_MS = 1000;

const VideoAnalyzer: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoSrc(URL.createObjectURL(file));
            setAnalysis('');
            setError(null);
            setProgress('');
        }
    };

    const extractFrames = (): Promise<string[]> => {
        return new Promise((resolve, reject) => {
            const video = videoRef.current;
            if (!video) {
                return reject(new Error("Video element not found"));
            }

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const frames: string[] = [];
            let frameCount = 0;

            video.onseeked = () => {
                if (frameCount < MAX_FRAMES) {
                    if(!context) return reject("Canvas context not found");
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    frames.push(dataUrl.split(',')[1]); // remove data:image/jpeg;base64,
                    
                    setProgress(`Extracted frame ${frameCount + 1} of ${MAX_FRAMES}`);
                    frameCount++;

                    if (frameCount < MAX_FRAMES && video.currentTime + FRAME_INTERVAL_MS / 1000 < video.duration) {
                        video.currentTime += FRAME_INTERVAL_MS / 1000;
                    } else {
                        resolve(frames);
                    }
                } else {
                    resolve(frames);
                }
            };

            video.currentTime = 0;
        });
    };

    const handleAnalyze = async () => {
        if (!prompt || !videoSrc) {
            setError('Please upload a video and enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysis('');
        setProgress('Starting analysis...');

        try {
            const frames = await extractFrames();
            setProgress('Sending frames for analysis...');
            const result = await analyzeVideo(prompt, frames);
            setAnalysis(result);
        } catch (err) {
            console.error(err);
            setError('Failed to analyze video. Please try again.');
        } finally {
            setIsLoading(false);
            setProgress('');
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-200">Video Input</h2>
                    <div className="p-4 bg-slate-800 rounded-lg">
                        <label htmlFor="video-upload" className="block text-sm font-medium text-slate-300 mb-2">1. Upload Video (short clips work best)</label>
                         <input id="video-upload" name="video-upload" type="file" className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" accept="video/*" onChange={handleVideoUpload} />
                    </div>
                    {videoSrc && (
                        <div className="bg-slate-800 rounded-lg p-2">
                            <video ref={videoRef} src={videoSrc} controls className="w-full rounded" muted onLoadedMetadata={() => videoRef.current && (videoRef.current.currentTime = 0)}></video>
                        </div>
                    )}
                    <div className="p-4 bg-slate-800 rounded-lg">
                         <label htmlFor="video-prompt" className="block text-sm font-medium text-slate-300 mb-2">2. What to analyze?</label>
                        <textarea
                            id="video-prompt"
                            rows={3}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="e.g., Describe the main objects and actions in this video..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>
                     <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !prompt || !videoSrc}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
                    >
                         {isLoading ? <><LoadingSpinner /> Analyzing...</> : <><AnalyzeIcon className="w-5 h-5"/> Analyze Video</>}
                    </button>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </div>
                 <div className="space-y-4">
                     <h2 className="text-2xl font-bold text-slate-200">Analysis Result</h2>
                     <div className="h-full p-4 bg-slate-800 rounded-lg border border-slate-700">
                        {isLoading && <p className="text-slate-400">{progress}</p>}
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <LoadingSpinner />
                            </div>
                        ) : analysis ? (
                            <div className="text-slate-200 whitespace-pre-wrap overflow-y-auto max-h-[60vh]">{analysis}</div>
                        ) : (
                            <p className="text-slate-500">Analysis from Gemini Pro will appear here.</p>
                        )}
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default VideoAnalyzer;
