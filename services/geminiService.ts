
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getChat = () => ai.chats.create({ model: 'gemini-2.5-flash' });
export const getGroundedChat = () => ai.chats.create({ 
    model: 'gemini-2.5-flash',
    config: {
        tools: [{googleSearch: {}}]
    }
});


export const editImage = async (prompt: string, image: { data: string; mimeType: string }): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: image.data, mimeType: image.mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error("No image generated");
};


export const analyzeVideo = async (prompt: string, frames: string[]): Promise<string> => {
    const frameParts = frames.map(frame => ({
        inlineData: {
            mimeType: 'image/jpeg',
            data: frame,
        }
    }));

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: {
            parts: [
                { text: prompt },
                ...frameParts,
            ]
        }
    });
    return response.text;
};

export const processText = async (prompt: string, text: string, modelType: 'flash' | 'pro'): Promise<string> => {
    const modelName = modelType === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    const fullPrompt = `${prompt}:\n\n---\n\n${text}`;
    const response = await ai.models.generateContent({ 
        model: modelName,
        contents: fullPrompt 
    });
    return response.text;
};

export const generateSpeech = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: `Say this naturally: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data received from API");
    }
    return base64Audio;
};

// Helper for file to base64 conversion
export const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // result is "data:mime/type;base64,..."
            const base64Data = result.split(',')[1];
            resolve({ data: base64Data, mimeType: file.type });
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};
