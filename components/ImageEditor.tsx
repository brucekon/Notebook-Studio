
import React, { useState } from 'react';
import { editImage, fileToBase64 } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import { UploadIcon, MagicWandIcon } from './common/Icons';

const ImageEditor: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setOriginalImage(reader.result as string);
                setEditedImage(null); // Clear previous edit
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!prompt || !imageFile) {
            setError('Please upload an image and enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setEditedImage(null);

        try {
            const { data, mimeType } = await fileToBase64(imageFile);
            const generatedData = await editImage(prompt, { data, mimeType });
            setEditedImage(`data:${mimeType};base64,${generatedData}`);
        } catch (err) {
            console.error(err);
            setError('Failed to edit image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-200">Controls</h2>
                    <div className="p-4 bg-slate-800 rounded-lg">
                        <label htmlFor="image-upload" className="block text-sm font-medium text-slate-300 mb-2">1. Upload Image</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
                                <div className="flex text-sm text-slate-500">
                                    <label htmlFor="image-upload" className="relative cursor-pointer bg-slate-700 rounded-md font-medium text-cyan-400 hover:text-cyan-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-800 focus-within:ring-cyan-500 p-1">
                                        <span>Upload a file</span>
                                        <input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-800 rounded-lg">
                        <label htmlFor="prompt" className="block text-sm font-medium text-slate-300 mb-2">2. Describe Your Edit</label>
                        <textarea
                            id="prompt"
                            rows={3}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="e.g., Add a retro filter, make it look like a watercolor painting..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt || !originalImage}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? <><LoadingSpinner /> Generating...</> : <><MagicWandIcon className="w-5 h-5"/> Apply Edit</>}
                    </button>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </div>

                <div className="space-y-4">
                     <h2 className="text-2xl font-bold text-slate-200">Results</h2>
                     <div className="grid grid-cols-1 gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-300 mb-2">Original</h3>
                            <div className="aspect-square bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                                {originalImage ? <img src={originalImage} alt="Original" className="max-h-full max-w-full object-contain rounded-lg"/> : <p className="text-slate-500">Upload an image to start</p>}
                            </div>
                        </div>
                         <div>
                            <h3 className="text-lg font-semibold text-slate-300 mb-2">Edited</h3>
                            <div className="aspect-square bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                                {isLoading ? <LoadingSpinner /> : editedImage ? <img src={editedImage} alt="Edited" className="max-h-full max-w-full object-contain rounded-lg"/> : <p className="text-slate-500">Your edited image will appear here</p>}
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;
