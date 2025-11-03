
import React, { useState } from 'react';
import { processText } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import { ProcessIcon } from './common/Icons';

const TextProcessor: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState<'flash' | 'pro'>('flash');
    const [outputText, setOutputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleProcess = async () => {
        if (!prompt || !inputText) {
            setError('Please provide input text and a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setOutputText('');

        try {
            const result = await processText(prompt, inputText, model);
            setOutputText(result);
        } catch (err) {
            console.error(err);
            setError('Failed to process text. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-200">Input</h2>
                    <div className="p-4 bg-slate-800 rounded-lg">
                        <label htmlFor="input-text" className="block text-sm font-medium text-slate-300 mb-2">1. Paste your text here</label>
                        <textarea
                            id="input-text"
                            rows={10}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="Enter the text you want to work with..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                    </div>
                    <div className="p-4 bg-slate-800 rounded-lg">
                        <label htmlFor="text-prompt" className="block text-sm font-medium text-slate-300 mb-2">2. Tell me what to do</label>
                        <input
                            id="text-prompt"
                            type="text"
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="e.g., Summarize this, translate to French, fix grammar..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>
                    <div className="p-4 bg-slate-800 rounded-lg">
                        <label className="block text-sm font-medium text-slate-300 mb-2">3. Choose a model</label>
                        <div className="flex space-x-4">
                            <button onClick={() => setModel('flash')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${model === 'flash' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                                Flash (Fast)
                            </button>
                            <button onClick={() => setModel('pro')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${model === 'pro' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                                Pro (Complex Tasks)
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleProcess}
                        disabled={isLoading || !prompt || !inputText}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
                    >
                         {isLoading ? <><LoadingSpinner /> Processing...</> : <><ProcessIcon className="w-5 h-5"/> Process Text</>}
                    </button>
                     {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </div>
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-200">Output</h2>
                    <div className="h-full p-4 bg-slate-800 rounded-lg border border-slate-700 min-h-[400px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <LoadingSpinner />
                            </div>
                        ) : outputText ? (
                            <div className="text-slate-200 whitespace-pre-wrap overflow-y-auto max-h-[60vh]">{outputText}</div>
                        ) : (
                            <p className="text-slate-500">The processed text will appear here.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TextProcessor;
