
export enum ChatRole {
  USER = 'user',
  MODEL = 'model',
}

export interface ChatMessage {
  role: ChatRole;
  text: string;
  sources?: GroundingSource[];
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export type Feature = 'chat' | 'image' | 'video' | 'text' | 'audio';

export interface ChatSession {
  title: string;
  messages: ChatMessage[];
}

export type ChatHistory = Record<string, ChatSession>;
